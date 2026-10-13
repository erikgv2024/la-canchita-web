// Abrir y cerrar el menú para celulares.
const botonMenu = document.getElementById('boton-menu');
const menu = document.getElementById('menu-principal');
const botonSubmenu = document.getElementById('boton-submenu');
const submenu = document.getElementById('submenu-canchas');

function cerrarSubmenu() {
  submenu.hidden = true;
  botonSubmenu.setAttribute('aria-expanded', 'false');
}

botonMenu.addEventListener('click', function () {
  const abierto = menu.classList.toggle('abierto');
  botonMenu.setAttribute('aria-expanded', String(abierto));
  if (!abierto) cerrarSubmenu();
});

// El submenú funciona tanto con clic como con teclado.
botonSubmenu.addEventListener('click', function () {
  submenu.hidden = !submenu.hidden;
  botonSubmenu.setAttribute('aria-expanded', String(!submenu.hidden));
});

document.addEventListener('click', function (evento) {
  if (!evento.target.closest('.grupo-submenu')) cerrarSubmenu();
});

document.addEventListener('keydown', function (evento) {
  if (evento.key === 'Escape') {
    if (!submenu.hidden) {
      cerrarSubmenu();
      botonSubmenu.focus();
    } else if (menu.classList.contains('abierto')) {
      menu.classList.remove('abierto');
      botonMenu.setAttribute('aria-expanded', 'false');
      botonMenu.focus();
    }
  }
});

// Mostrar las canchas del deporte seleccionado.
const filtros = document.querySelectorAll('[data-filtro]');
const canchas = document.querySelectorAll('.cancha');
const resultado = document.getElementById('resultado-filtro');

function filtrarCanchas(deporte) {
  let cantidad = 0;
  canchas.forEach(function (cancha) {
    const mostrar = deporte === 'todas' || cancha.dataset.deporte === deporte;
    cancha.hidden = !mostrar;
    if (mostrar) cantidad++;
  });
  filtros.forEach(function (boton) {
    const seleccionado = boton.dataset.filtro === deporte;
    boton.classList.toggle('activo', seleccionado);
    boton.setAttribute('aria-pressed', String(seleccionado));
  });
  resultado.textContent = 'Mostrando ' + cantidad + ' canchas.';
}

if (resultado) {
  filtros.forEach(function (boton) {
    boton.addEventListener('click', function () {
      filtrarCanchas(boton.dataset.filtro);
    });
  });
  // Los enlaces de Inicio y del submenú pueden seleccionar un deporte.
  const parametros = new URLSearchParams(window.location.search);
  const deporte = parametros.get('deporte');
  if (deporte === 'futbol' || deporte === 'voley') filtrarCanchas(deporte);
}

// Calculadora y solicitud de ejemplo. Todo funciona en esta página, sin envíos.
const formulario = document.getElementById('formulario-reserva');

if (formulario) {
  const campos = ['nombre', 'correo', 'telefono', 'cancha', 'fecha', 'hora', 'duracion'];
  const resultadoCalculo = document.getElementById('resultado-calculo');
  const erroresFormulario = document.getElementById('errores-formulario');
  const confirmacion = document.getElementById('confirmacion-solicitud');
  const resumen = document.getElementById('resumen-solicitud');

  function campo(id) {
    return document.getElementById(id);
  }

  // Construir la fecha local sin convertirla a UTC.
  function fechaActual() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return hoy.getFullYear() + '-' + mes + '-' + dia;
  }
  campo('fecha').min = fechaActual();

  function mostrarError(id, mensaje) {
    const aviso = campo('error-' + id);
    aviso.textContent = mensaje;
    aviso.hidden = !mensaje;
    campo(id).classList.toggle('is-invalid', Boolean(mensaje));
    campo(id).setAttribute('aria-invalid', String(Boolean(mensaje)));
  }

  function revisarCampo(id) {
    const valor = campo(id).value.trim();
    let mensaje = '';
    if (!valor) {
      mensaje = 'Completa este campo.';
    } else if (id === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      mensaje = 'Escribe un correo válido, por ejemplo nombre@ejemplo.com.';
    } else if (id === 'telefono') {
      const digitos = valor.replace(/\D/g, '');
      if (!/^\+?[\d\s()-]+$/.test(valor) || digitos.length < 7 || digitos.length > 15) {
        mensaje = 'Escribe un teléfono de 7 a 15 dígitos; puedes usar +, espacios o guiones.';
      }
    } else if (id === 'fecha' && valor < fechaActual()) {
      mensaje = 'Elige hoy o una fecha futura.';
    } else if (
      id === 'duracion' &&
      campo('hora').value &&
      Number(campo('hora').value) + Number(valor) > 23
    ) {
      mensaje = 'El alquiler debe terminar como máximo a las 11 p. m.';
    }
    mostrarError(id, mensaje);
    return mensaje === '';
  }

  function revisarAlquiler() {
    let correcto = true;
    ['cancha', 'hora', 'duracion'].forEach(function (id) {
      if (!revisarCampo(id)) correcto = false;
    });
    return correcto;
  }

  // Recorrer las horas permite sumar cada tramo con su tarifa.
  function calcularPrecio() {
    const opcion = campo('cancha').selectedOptions[0];
    const futbol = opcion.dataset.deporte === 'futbol';
    const tarifaDia = futbol ? 40 : 30;
    const tarifaNoche = futbol ? 50 : 40;
    const inicio = Number(campo('hora').value);
    const duracion = Number(campo('duracion').value);
    let horasDia = 0;
    let horasNoche = 0;
    for (let hora = inicio; hora < inicio + duracion; hora++) {
      if (hora < 17) horasDia++;
      else horasNoche++;
    }
    return {
      total: horasDia * tarifaDia + horasNoche * tarifaNoche,
      horasDia: horasDia,
      horasNoche: horasNoche,
      tarifaDia: tarifaDia,
      tarifaNoche: tarifaNoche,
      fin: inicio + duracion,
    };
  }

  function mostrarCalculo() {
    if (!revisarAlquiler()) {
      resultadoCalculo.textContent = 'Completa o corrige cancha, hora y duración para calcular.';
      return null;
    }
    const precio = calcularPrecio();
    const tramos = [];
    if (precio.horasDia) tramos.push(precio.horasDia + ' h de día × S/ ' + precio.tarifaDia);
    if (precio.horasNoche)
      tramos.push(precio.horasNoche + ' h de noche × S/ ' + precio.tarifaNoche);
    resultadoCalculo.textContent = 'Total estimado: S/ ' + precio.total + '\n' + tramos.join(' + ');
    return precio;
  }

  document.getElementById('calcular-total').addEventListener('click', mostrarCalculo);

  // Mantener el total actualizado cuando cambian los datos del alquiler.
  formulario.addEventListener('change', function (evento) {
    if (['cancha', 'hora', 'duracion'].includes(evento.target.id)) {
      if (campo('cancha').value && campo('hora').value && campo('duracion').value) mostrarCalculo();
      else resultadoCalculo.textContent = 'Selecciona cancha, hora y duración para calcular.';
    }
  });

  formulario.addEventListener('input', function (evento) {
    if (campos.includes(evento.target.id)) mostrarError(evento.target.id, '');
    confirmacion.hidden = true;
    erroresFormulario.hidden = true;
  });

  function agregarResumen(etiqueta, valor) {
    const fila = document.createElement('div');
    const titulo = document.createElement('dt');
    const dato = document.createElement('dd');
    titulo.textContent = etiqueta;
    dato.textContent = valor;
    fila.append(titulo, dato);
    resumen.appendChild(fila);
  }

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    confirmacion.hidden = true;
    let correcto = true;
    campos.forEach(function (id) {
      if (!revisarCampo(id)) correcto = false;
    });
    if (!correcto) {
      erroresFormulario.textContent =
        'Revisa los campos señalados. Tus datos se conservan para corregirlos.';
      erroresFormulario.hidden = false;
      campo(
        campos.find(function (id) {
          return campo(id).getAttribute('aria-invalid') === 'true';
        }),
      ).focus();
      return;
    }
    erroresFormulario.hidden = true;
    const precio = mostrarCalculo();
    resumen.replaceChildren();
    agregarResumen('Nombre', campo('nombre').value.trim());
    agregarResumen('Correo', campo('correo').value.trim());
    agregarResumen('Teléfono', campo('telefono').value.trim());
    agregarResumen('Cancha', campo('cancha').selectedOptions[0].textContent);
    const partesFecha = campo('fecha').value.split('-');
    agregarResumen('Fecha', partesFecha[2] + '/' + partesFecha[1] + '/' + partesFecha[0]);
    agregarResumen(
      'Horario',
      campo('hora').value.padStart(2, '0') + ':00 a ' + String(precio.fin).padStart(2, '0') + ':00',
    );
    agregarResumen('Duración', campo('duracion').selectedOptions[0].textContent);
    agregarResumen('Total estimado', 'S/ ' + precio.total);
    confirmacion.hidden = false;
    confirmacion.focus();
  });

  document.getElementById('volver-formulario').addEventListener('click', function () {
    confirmacion.hidden = true;
    campo('nombre').focus();
  });
}
