const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { consultaHCP } = require("./consulta-hcp.js");
const dayjs = require("dayjs");
const path = require("path");

const port = process.env.PORT || 3000;
const API_BOT_TOKEN = process.env.BOT_API_KEY;
const url = process.env.URL_VERCEL;

const app = express();
app.use(express.json());

const bot = new TelegramBot(API_BOT_TOKEN, { webHook: true });
bot.setWebHook(`${url}api/bot`);

app.post("/api/bot", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.setMyCommands([
  { command: "/start", description: "Iniciar el bot" },
  { command: "/handicap", description: "Consultar tu handicap" },
  {
    command: "/handicapytarjetas",
    description: "Consulta de handicap y creacion de tarjetas en pdf",
  },
]);

bot.onText(/\/handicapytarjetas/, async (msg) => {
  const todayMiliseconds = dayjs().valueOf();
  const arrayMatriculas = extraerMatriculas(msg.text);
  const tarjetas = true;
  consultaHCP(arrayMatriculas, todayMiliseconds, tarjetas).then((response) => {
    const pdfPath = `./tarjetas-${todayMiliseconds}.pdf`;
    const pdfPathDelete = path.join(
      __dirname,
      `tarjetas-${todayMiliseconds}.pdf`
    );
    bot.sendMessage(
      msg.chat.id,
      response.join("\n--------------------------------------\n"),
      {
        parse_mode: "Markdown",
      }
    );
    // bot.sendMessage(msg.chat.id, "");
    setTimeout(() => {
      bot.sendDocument(msg.chat.id, fs.createReadStream(pdfPath)).then(() =>
        fs.unlink(pdfPathDelete, (err) => {
          if (err) {
            console.error("Error al eliminar el archivo:", err);
          } else {
            console.log("Archivo PDF eliminado exitosamente");
          }
        })
      );
    }, 2000);
  });
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "¡Bienvenido al bot de consulta de handicap de golf de los Caldenes!"
  );
});

// Manejar el comando /handicap
bot.onText(/\/handicap/, async (msg) => {
  const todayMiliseconds = dayjs().valueOf();
  const arrayMatriculas = extraerMatriculas(msg.text);
  const tarjetas = false;
  consultaHCP(arrayMatriculas, todayMiliseconds, tarjetas).then((response) => {
    bot.sendMessage(
      msg.chat.id,
      response.join("\n--------------------------------------\n"),
      {
        parse_mode: "Markdown",
      }
    );
  });
});

// Manejar el comando /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Puedes usar los siguientes comandos:\n/start - Iniciar el bot\n/handicap - Consultar tu handicap\n/help - Ver la ayuda disponible"
  );
});

// Listen for any kind of message. There are different kinds of
// messages.
// bot.on("message", (msg) => {
//   const chatId = msg.chat.id;

//   // send a message to the chat acknowledging receipt of their message
//   bot.sendMessage(chatId, "holaaaa");
// });

bot.on("tomi", (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, "escribiste tomii");
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function extraerMatriculas(mensaje) {
  // Remover el comando /handicap del mensaje
  const sinComando = mensaje.replace("/handicapytarjetas", "").trim();

  // Separar las matrículas por comas y eliminar espacios adicionales
  const matriculas = sinComando.split(",").map((matricula) => matricula.trim());

  return matriculas;
}
