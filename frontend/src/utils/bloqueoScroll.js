let bloqueosActivos = 0;
let estilosOriginales = null;

export const bloquearScroll = () => {
  if (typeof document === "undefined") return;

  if (bloqueosActivos === 0) {
    estilosOriginales = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    document.body.style.overflow = "hidden";
  }

  bloqueosActivos += 1;
};

export const desbloquearScroll = () => {
  if (typeof document === "undefined" || bloqueosActivos === 0) return;

  bloqueosActivos -= 1;
  if (bloqueosActivos === 0) {
    document.body.style.overflow = estilosOriginales?.overflow || "";
    document.body.style.paddingRight = estilosOriginales?.paddingRight || "";
    estilosOriginales = null;
  }
};
