// ----- FUNCIONES UTILITARIAS -----
let carrito = [];

async function cargarCarrito() {
    try {
        const response = await fetch('/api/carrito');
        const data = await response.json();
        carrito = data;
        return data;
    } catch (error) {
        console.error('Error cargando carrito:', error);
        carrito = [];
        return [];
    }
}

async function eliminarProducto(id) {
    try {
        const response = await fetch(`/api/carrito/eliminar/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            carrito = data.carrito;
        }
        return data.success;
    } catch (error) {
        console.error('Error eliminando producto:', error);
        return false;
    }
}

async function actualizarCantidad(id, cantidad) {
    try {
        const response = await fetch(`/api/carrito/actualizar/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cantidad })
        });
        const data = await response.json();
        if (data.success) {
            carrito = data.carrito;
        }
        return data.success;
    } catch (error) {
        console.error('Error actualizando cantidad:', error);
        return false;
    }
}

// ----- DESHABILITAR BOTÓN FINALIZAR SI EL CARRITO ESTÁ VACÍO -----
function actualizarEstadoBotonFinalizar() {
    const btnFinalizar = document.getElementById('link-finalizar');
    if (!btnFinalizar) return;
    if (carrito.length === 0) {
        btnFinalizar.classList.add('disabled');
        btnFinalizar.setAttribute('aria-disabled', 'true');
        btnFinalizar.onclick = (e) => e.preventDefault();
    } else {
        btnFinalizar.classList.remove('disabled');
        btnFinalizar.removeAttribute('aria-disabled');
        btnFinalizar.onclick = null;
    }
}

// ----- RENDERIZAR LA VISTA CARRITO PRINCIPAL -----
function renderCarrito() {
    const carritoLista = document.getElementById('carrito-lista');
    carritoLista.innerHTML = '';
    let subtotal = 0;
    if (carrito.length === 0) {
        carritoLista.innerHTML = `<div class="text-center text-muted my-5">El carrito está vacío.</div>`;
    }
    carrito.forEach(producto => {
        subtotal += producto.precio * producto.cantidad;
        const item = document.createElement('div');
        item.className = "card mb-3";
        item.innerHTML = `
      <div class="row g-0 align-items-center">
        <div class="col-md-2">
          <div class="position-relative" style="width: 100%; height: 96px;">
            <img src="/img/${producto.imagen}" alt="${producto.nombre}" 
                 class="w-100 h-100 object-fit-cover rounded-start" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <div class="bg-light d-none align-items-center justify-content-center w-100 h-100 rounded-start">
              <i class="bi bi-image fs-1 text-secondary"></i>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card-body">
            <h6 class="card-title mb-1">${producto.nombre}</h6>
            <div class="mb-2 text-muted">$${producto.precio.toLocaleString('es-CL')}</div>
          </div>
        </div>
        <div class="col-md-3 d-flex align-items-center justify-content-end pe-3">
          <button class="btn btn-outline-secondary btn-sm btn-restar" data-id="${producto.id}">-</button>
          <span class="mx-2" id="cantidad-${producto.id}">${producto.cantidad}</span>
          <button class="btn btn-outline-secondary btn-sm btn-sumar" data-id="${producto.id}">+</button>
          <button class="btn btn-link btn-sm ms-3 text-danger btn-eliminar" data-id="${producto.id}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;
        carritoLista.appendChild(item);
    });

    // ----- Actualiza totales -----
    document.getElementById('subtotalCarrito').textContent = `$${subtotal.toLocaleString('es-CL')}`;
    const envio = carrito.length > 0 ? 4500 : 0; // Cambia 4500 por tu costo real si quieres
    document.getElementById('envioCarrito').textContent = `$${envio.toLocaleString('es-CL')}`;
    document.getElementById('totalCarrito').textContent = `$${(subtotal + envio).toLocaleString('es-CL')}`;

    // ----- Botones para sumar/restar/eliminar -----
    document.querySelectorAll('.btn-sumar').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            const producto = carrito.find(p => p.id === id);
            if (producto) {
                await actualizarCantidad(id, producto.cantidad + 1);
                renderCarrito();
            }
        };
    });
    document.querySelectorAll('.btn-restar').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            const producto = carrito.find(p => p.id === id);
            if (producto && producto.cantidad > 1) {
                await actualizarCantidad(id, producto.cantidad - 1);
                renderCarrito();
            }
        };
    });
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            await eliminarProducto(id);
            renderCarrito();
        };
    });

    // ----- ACTUALIZA ESTADO DEL BOTÓN FINALIZAR -----
    actualizarEstadoBotonFinalizar();
}

// ----- Renderiza el carrito al cargar la página -----
document.addEventListener('DOMContentLoaded', async () => {
    await cargarCarrito();
    renderCarrito();
});