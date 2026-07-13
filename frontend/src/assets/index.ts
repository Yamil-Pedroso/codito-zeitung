import politik from "./images/cards-cat/politica.png";
import wirtschaft from "./images/cards-cat/economia.png";
import wissenschaft from "./images/cards-cat/ciencia.png";
import gesundheit from "./images/cards-cat/salud_educacion_sociedad.png";
import kultur from "./images/cards-cat/cultura.png";
import transport from "./images/cards-cat/transporte_asuntos_zurich.png";
import sport from "./images/cards-cat/deportes.png";
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
