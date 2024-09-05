const axios = require("axios");
const iconv = require("iconv-lite");
const cheerio = require("cheerio");
const hcpCaldenesTabla = require("./hcp-caldenes.json");
const { modifyPdf } = require("./modifyPDF");
const consultaHCP = async (arrayMatriculas, todayMiliseconds, tarjetas) => {
  let playersInfo = [];
  const respuesta = arrayMatriculas.map(async (matricula) => {
    try {
      const response = await axios.post(
        "https://www.vistagolf.com.ar/handicap/FiltroArg.asp",
        new URLSearchParams({
          TxtNroMatricula: matricula,
          TxtApellido: "",
          Enviar: "Aceptar",
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          responseType: "arraybuffer", // Recibir como buffer binario
          responseEncoding: "binary",
        }
      );
      const data = response.data;

      const utf8Body = iconv.decode(Buffer.from(data), "iso-8859-1");
      const $ = cheerio.load(utf8Body, { decodeEntities: false });
      const fila = $("table#table19 tr").eq(2);

      // Extraer los datos
      const numeroMatricula = fila.find("td").eq(0).text().trim();
      const apellido = fila.find("td").eq(1).text().trim();
      const hcpIndex = fila.find("td").eq(2).text().trim();
      const club = fila.find("td").eq(3).text().trim();
      const hcpCaldenes = hcpCaldenesTabla.filter(
        (r) =>
          parseFloat(hcpIndex.replace(",", ".")) >=
            parseFloat(r.Desde.replace(",", ".")) &&
          parseFloat(hcpIndex.replace(",", ".")) <=
            parseFloat(r.Hasta.replace(",", "."))
      )[0].value;

      playersInfo.push({
        numeroMatricula,
        apellido,
        hcpIndex,
        club,
        hcpCaldenes,
      });

      const formattedMessage = formatMessage(
        numeroMatricula,
        apellido,
        hcpIndex,
        club,
        "Ningún detalle adicional",
        hcpCaldenes
      );

      return formattedMessage;
    } catch (error) {
      console.error("Error al obtener datos:", error);

      return error;
    }
  });
  if (tarjetas) {
    Promise.all(respuesta).then((response) => {
      console.log("tehnnn");
      modifyPdf(playersInfo, todayMiliseconds);
    });
  }

  return await Promise.all(respuesta);
};

const formatMessage = (
  matricula,
  nombre,
  handicap,
  categoria,
  otrosDetalles,
  hcpCaldenes
) => {
  return `*Nombre:* ${nombre} | *Matrícula:* ${matricula} | *Index:* ${handicap} | *HCP-Caldenes:* ${hcpCaldenes}`;
};

// return `
//   *Información de Handicap*

//   *Nombre:* ${nombre}
//   *Matrícula:* ${matricula}
//   *Handicap:* ${handicap}
//   *Club:* ${categoria}

//   _Otros Detalles:_
//   ${otrosDetalles}

//   ¡Gracias por consultar!
//   `;
module.exports = { consultaHCP };
