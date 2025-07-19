let carrito = [];

// Trae el carrito desde el backend
async function cargarCarrito() {
    try {
        const res = await fetch('/api/carrito');
        carrito = await res.json();
        renderCarritoLateral();
    } catch (err) {
        carrito = [];
        renderCarritoLateral();
    }
}

// Agrega un producto usando el endpoint backend (igual que en catalogo.js)
async function agregarAlCarrito(id, nombre, precio, imagen) {
    try {
        const response = await fetch('/api/carrito/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, nombre, precio, imagen })
        });
        const data = await response.json();
        if (data.success) {
            carrito = data.carrito;
            cargarCarrito();
        } else {
            alert(data.message || 'Error agregando producto al carrito');
        }
        return data.success;
    } catch (error) {
        console.error('Error agregando al carrito:', error);
        return false;
    }
}

// Renderiza el sidebar del carrito (ahora con la imagen del producto)
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
                await actualizarCantidadCarrito(id, producto.cantidad + 1);
                renderCarritoLateral();
            }
        };
    });
    document.querySelectorAll('.btn-restar').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            const producto = carrito.find(p => p.id === id);
            if (producto && producto.cantidad > 1) {
                await actualizarCantidadCarrito(id, producto.cantidad - 1);
                renderCarritoLateral();
            }
        };
    });
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            await eliminarProductoCarrito(id);
            renderCarritoLateral();
        };
    });

    // --- Actualiza el estado del botón finalizar ---
    if (typeof actualizarEstadoBotonFinalizarSidebar === "function") {
        actualizarEstadoBotonFinalizarSidebar();
    }
}

// Actualiza cantidad en backend
async function actualizarCantidadCarrito(id, cantidad) {
    try {
        await fetch('/api/carrito/actualizar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, cantidad })
        });
    } catch (error) {
        console.error('Error actualizando cantidad:', error);
    }
}

// Elimina producto en backend
async function eliminarProductoCarrito(id) {
    try {
        await fetch('/api/carrito/eliminar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
        });
    } catch (error) {
        console.error('Error eliminando producto:', error);
    }
}

// ======= DETALLE DE PRODUCTO =======
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

let productoActual = null;

async function cargarProductoDetalle() {
    const id = parseInt(getQueryParam('id') || '1');
    const res = await fetch('/api/productos');
    const productos = await res.json();
    const prod = productos.find(p => p.id === id);

    if (!prod) {
        document.getElementById('producto-nombre').textContent = "Producto no encontrado";
        document.getElementById('btn-agregar-carrito').disabled = true;
        return;
    }
    productoActual = prod;

    document.title = `${prod.nombre} | Lufa Store`;
    document.getElementById('producto-imagen').src = '/img/' + prod.imagen;
    document.getElementById('producto-imagen').alt = prod.nombre;
    document.getElementById('producto-nombre').textContent = prod.nombre;
    document.getElementById('producto-precio').textContent = `$${prod.precio.toLocaleString('es-CL')}`;
    document.getElementById('producto-descripcion').textContent = prod.descripcion;
    document.getElementById('producto-stock').textContent = prod.stock;
    if (document.getElementById('producto-descripcion-extendida')) {
        document.getElementById('producto-descripcion-extendida').textContent =
            prod.descripcionLarga || prod.descripcion || "";
    }

    // Deshabilita botón si no hay stock
    if (prod.stock < 1) {
        document.getElementById('btn-agregar-carrito').disabled = true;
        document.getElementById('mensaje-stock').textContent = 'Sin stock disponible';
    }
}

// Manejo de cantidad
let cantidad = 1;
document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
    cargarProductoDetalle();

    const inputCantidad = document.getElementById('producto-cantidad');
    document.getElementById('btn-restar').onclick = () => {
        cantidad = Math.max(1, cantidad - 1);
        inputCantidad.value = cantidad;
    };
    document.getElementById('btn-sumar').onclick = () => {
        cantidad = cantidad + 1;
        inputCantidad.value = cantidad;
    };
    inputCantidad.oninput = () => {
        cantidad = Math.max(1, parseInt(inputCantidad.value) || 1);
        inputCantidad.value = cantidad;
    };

    // Evento agregar al carrito
    document.getElementById('btn-agregar-carrito').onclick = async () => {
        if (!productoActual) return;

        for (let i = 0; i < cantidad; i++) {
            await agregarAlCarrito(
                productoActual.id,
                productoActual.nombre,
                productoActual.precio,
                productoActual.imagen // AHORA incluye la imagen del producto
            );
        }

        // Muestra el sidebar con el carrito actualizado
        var myOffcanvas = new bootstrap.Offcanvas(document.getElementById('carritoOffcanvas'));
        myOffcanvas.show();
        await cargarCarrito();
    };
});