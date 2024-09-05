const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs");
const dayjs = require("dayjs");

async function modifyPdf(playersInfo, todayMiliseconds) {
  const today = dayjs().format("DD/MM/YYYY");
  console.log(playersInfo, "playerssss");
  // Lee el PDF original
  if (playersInfo) {
    console.log(playersInfo, "enterr");
    const playersPerPage = 3;
    const playersNumber = playersInfo.length;
    const numeroDePaginasACrear = Math.ceil(
      Math.abs(playersNumber) / playersPerPage
    );
    const existingPdfBytes = fs.readFileSync("tarjetaCaldenes.pdf");

    // Crea un nuevo documento PDF a partir del existente
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Obtén la primera página
    // const page = pdfDoc.getPages()[0];
    const [firstPage] = await pdfDoc.copyPages(pdfDoc, [0]);

    for (let i = 1; i < numeroDePaginasACrear; i++) {
      pdfDoc.addPage(firstPage);
    }

    const pages = pdfDoc.getPages();
    const xPositions = {
      name: 42,
      matricula: 175,
      date: 243,
      handicap: 509,
    };

    const yPositions = [776, 505, 230];

    // playersInfo.map((player, index) => {
    //   console.log(player, index);
    // });

    for (let i = 0; i < playersInfo.length; i++) {
      const player = playersInfo[i];
      const pageIndex = Math.floor(i / playersPerPage); // La página a la que agregar el jugador
      const page = pages[pageIndex];

      // Posición de la tarjeta (ajustar según el diseño de la tarjeta)
      const cardIndex = i % playersPerPage;
      const baseY = yPositions[cardIndex]; // Ajusta según la altura y la cantidad de tarjetas por página

      page.drawText(player.apellido, {
        x: xPositions.name, // Coordenada X
        y: baseY, // Coordenada Y
        size: 10,
        color: rgb(0, 0, 0), // Color negro
      });

      page.drawText(player.numeroMatricula, {
        x: xPositions.matricula, // Coordenada X
        y: baseY, // Coordenada Y
        size: 10,
        color: rgb(0, 0, 0), // Color negro
      });

      page.drawText(today, {
        x: xPositions.date, // Coordenada X
        y: baseY, // Coordenada Y
        size: 10,
        color: rgb(0, 0, 0), // Color negro
      });

      page.drawText(player.hcpCaldenes, {
        x: xPositions.handicap, // Coordenada X
        y: baseY, // Coordenada Y
        size: 10,
        color: rgb(0, 0, 0), // Color negro
      });
    }
    // Guarda el PDF modificado
    const pdfBytes = await pdfDoc.save();

    // Escribe el PDF modificado en un archivo
    fs.writeFileSync(`tarjetas-${todayMiliseconds}.pdf`, pdfBytes);
  }
}

modifyPdf().catch((err) => console.error(err));

module.exports = { modifyPdf };
