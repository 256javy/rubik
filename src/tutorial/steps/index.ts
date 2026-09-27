import * as v from "../../cube/validation";
import type { CubeState } from "../../cube/model";
export interface TutorialStage {
  id: string;
  title: string;
  description: string;
  mode: "spatial" | "algorithm";
  isComplete: (s: CubeState) => boolean;
  contentStatus: string;
  guidance?: { title: string; explanation: string };
}
// TODO(CUBY_CONTENT): Verify recognition cases, narration and exact algorithms against the video.
export const stages: TutorialStage[] = [
  {
    id: "cross",
    title: "La cruz blanca",
    description:
      "Cuatro aristas. Cada color lateral debe coincidir con su centro.",
    mode: "spatial",
    isComplete: v.crossComplete,
    contentStatus:
      "Guía espacial calculada; explicación de Cuby pendiente de verificar.",
  },
  {
    id: "corners",
    title: "Las esquinas blancas",
    description:
      "Encuentra el lugar de cada esquina a partir de sus tres colores.",
    mode: "spatial",
    isComplete: v.firstLayerComplete,
    contentStatus:
      "Guía espacial calculada; casos de Cuby pendientes de verificar.",
  },
  {
    id: "middle",
    title: "La segunda capa",
    description: "Coloca las aristas que no tienen amarillo.",
    mode: "algorithm",
    isComplete: v.middleComplete,
    contentStatus:
      "Inserciones de segunda capa verificadas con el modelo. TODO(CUBY_CONTENT): correspondencia con el vídeo pendiente.",
  },
  {
    id: "yellow-cross",
    guidance: {
      title: "Busca las cuatro pegatinas amarillas.",
      explanation:
        "Orientaremos las aristas para que su pegatina amarilla mire hacia la cara D. En este paso no es necesario que sus colores laterales coincidan con los centros. Las dos primeras capas se restauran al terminar cada algoritmo.",
    },
    title: "La cruz amarilla",
    description: "Orienta las cuatro aristas de la cara amarilla.",
    mode: "algorithm",
    isComplete: v.yellowCrossComplete,
    contentStatus:
      "Recorrido de última capa verificado con el modelo. TODO(CUBY_CONTENT): correspondencia con el vídeo pendiente.",
  },
  {
    id: "yellow-edges",
    guidance: {
      title: "Alinea las aristas con sus centros.",
      explanation:
        "La cruz amarilla ya está orientada. Ahora moveremos sus aristas hasta que cada color lateral coincida con su centro, conservando la cruz y las dos primeras capas.",
    },
    title: "Las aristas amarillas",
    description: "Alinea sus colores laterales con los centros.",
    mode: "algorithm",
    isComplete: v.yellowEdgesComplete,
    contentStatus:
      "Recorrido de última capa verificado con el modelo. TODO(CUBY_CONTENT): correspondencia con el vídeo pendiente.",
  },
  {
    id: "permutation",
    guidance: {
      title: "Reconoce el lugar de cada esquina.",
      explanation:
        "Cada esquina debe quedar entre los tres centros de sus colores. Su pegatina amarilla puede seguir mirando hacia un lado: la orientación se completa en el siguiente paso. Las aristas quedan restauradas al terminar.",
    },
    title: "Las últimas esquinas",
    description: "Cada esquina debe ocupar el lugar que le corresponde.",
    mode: "algorithm",
    isComplete: v.permutationComplete,
    contentStatus:
      "Recorrido de última capa verificado con el modelo. TODO(CUBY_CONTENT): correspondencia con el vídeo pendiente.",
  },
  {
    id: "orientation",
    guidance: {
      title: "Orienta las esquinas en su sitio.",
      explanation:
        "Las esquinas ya ocupan su lugar. La secuencia orienta sus pegatinas amarillas y restaura las posiciones de las aristas y las esquinas al terminar. Este paso concluye cuando las seis caras están resueltas.",
    },
    title: "La orientación final",
    description: "Orienta las esquinas para completar las seis caras.",
    mode: "algorithm",
    isComplete: v.cubeSolved,
    contentStatus:
      "Recorrido de última capa verificado con el modelo. TODO(CUBY_CONTENT): correspondencia con el vídeo pendiente.",
  },
];
