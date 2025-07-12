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

async function agregarAlCarrito(id, nombre, precio) {
    try {
        const response = await fetch('/api/carrito/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, nombre, precio })
        });
        const data = await response.json();
        if (data.success) {
            carrito = data.carrito;
        } else {
            alert(data.message || 'Error agregando producto al carrito');
        }
        return data.success;
    } catch (error) {
        console.error('Error agregando al carrito:', error);
        return false;
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

// ----- INICIALIZAR -----
document.addEventListener('DOMContentLoaded', async () => {
    await cargarCarrito();
});

// ----- EVENTO "AGREGAR AL CARRITO" -----
document.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
    btn.addEventListener('click', async function() {
        const id = parseInt(this.getAttribute('data-id'));
        const nombre = this.getAttribute('data-nombre');
        const precio = parseFloat(this.getAttribute('data-precio'));
        
        await agregarAlCarrito(id, nombre, precio);
        
        var myOffcanvas = new bootstrap.Offcanvas(document.getElementById('carritoOffcanvas'));
        myOffcanvas.show();
        renderCarritoLateral();
    });
});

// ----- RENDERIZAR EL CARRITO LATERAL -----
function renderCarritoLateral() {
    const contenedor = document.getElementById('carrito-lateral-lista');
    contenedor.innerHTML = '';
    let total = 0;
    if (carrito.length === 0) {
        contenedor.innerHTML = `<p class="text-center text-muted my-5">El carrito está vacío.</p>`;
    }
    carrito.forEach(producto => {
        total += producto.precio * producto.cantidad;
        const item = document.createElement('div');
        item.className = "mb-3 border-bottom pb-2";
        item.innerHTML = `
          <div class="d-flex align-items-center">
            <div class="me-2 position-relative" style="width: 48px; height: 48px;">
              <img src="/img/${producto.imagen}" alt="${producto.nombre}" 
                   class="w-100 h-100 object-fit-cover rounded" 
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
              <div class="bg-light rounded d-none align-items-center justify-content-center" style="width: 48px; height: 48px;">
                <i class="bi bi-image text-secondary"></i>
              </div>
            </div>
            <div class="flex-grow-1">
              <div>${producto.nombre}</div>
              <small class="text-muted">$${producto.precio.toLocaleString('es-CL')}</small>
            </div>
            <div class="d-flex align-items-center gap-1 ms-2">
              <button class="btn btn-outline-secondary btn-sm btn-restar" data-id="${producto.id}">-</button>
              <span class="mx-1 cantidad" id="cantidad-lateral-${producto.id}">${producto.cantidad}</span>
              <button class="btn btn-outline-secondary btn-sm btn-sumar" data-id="${producto.id}">+</button>
              <button class="btn btn-link btn-sm text-danger btn-eliminar" data-id="${producto.id}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        `;
        contenedor.appendChild(item);
    });
    document.getElementById('totalCarritoLateral').textContent = `$${total.toLocaleString('es-CL')}`;

    // Botones sumar/restar/eliminar
    document.querySelectorAll('.btn-sumar').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            const producto = carrito.find(p => p.id === id);
            if (producto) {
                await actualizarCantidad(id, producto.cantidad + 1);
                renderCarritoLateral();
            }
        };
    });
    document.querySelectorAll('.btn-restar').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            const producto = carrito.find(p => p.id === id);
            if (producto && producto.cantidad > 1) {
                await actualizarCantidad(id, producto.cantidad - 1);
                renderCarritoLateral();
            }
        };
    });
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            await eliminarProducto(id);
            renderCarritoLateral();
        };
    });
}

// ----- Mostrar el carrito lateral cada vez que se abre -----
document.getElementById('carritoOffcanvas').addEventListener('show.bs.offcanvas', async () => {
    await cargarCarrito();
    renderCarritoLateral();
});