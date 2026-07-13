import politik from "./images/cards-cat/politica.webp";
import wirtschaft from "./images/cards-cat/economia.webp";
import wissenschaft from "./images/cards-cat/ciencia.webp";
import gesundheit from "./images/cards-cat/salud_educacion_sociedad.webp";
import kultur from "./images/cards-cat/cultura.webp";
import transport from "./images/cards-cat/transporte_asuntos_zurich.webp";
import sport from "./images/cards-cat/deportes.webp";
import panorama from "./images/cards-cat/swiss-panorama.webp";

interface Asset {
  [key: string]: string;
}

const assets: Asset = {
  politik,
  wirtschaft,
  wissenschaft,
  gesundheit,
  kultur,
  transport,
  sport,
  panorama,
};

export default assets;
