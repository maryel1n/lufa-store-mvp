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

// Renderiza el sidebar del carrito (igual que en catalogo.js)
function renderCarritoLateral() {
    const lista = document.getElementById('carrito-lateral-lista');
    if (!lista) return;
    lista.innerHTML = '';

    if (carrito.length === 0) {
        lista.innerHTML = '<p class="text-center text-muted">Tu carrito está vacío.</p>';
        document.getElementById('totalCarritoLateral').textContent = '$0';
        return;
    }

    let total = 0;
    carrito.forEach((item, i) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        const div = document.createElement('div');
        div.className = 'd-flex align-items-center mb-2';
        div.innerHTML = `
            <div class="flex-grow-1">
                <div class="fw-bold">${item.nombre}</div>
                <div class="small text-muted">${item.cantidad} x $${item.precio.toLocaleString('es-CL')}</div>
            </div>
            <button class="btn btn-outline-secondary btn-sm ms-2" data-action="restar" data-index="${i}">-</button>
            <span class="mx-2">${item.cantidad}</span>
            <button class="btn btn-outline-secondary btn-sm" data-action="sumar" data-index="${i}">+</button>
            <button class="btn btn-link text-danger btn-sm ms-2" data-action="eliminar" data-index="${i}">
                <i class="bi bi-trash"></i>
            </button>
        `;
        lista.appendChild(div);
    });

    document.getElementById('totalCarritoLateral').textContent = `$${total.toLocaleString('es-CL')}`;

    // Eventos para sumar, restar y eliminar
    lista.querySelectorAll('button[data-action]').forEach(btn => {
        const action = btn.dataset.action;
        const index = parseInt(btn.dataset.index);
        btn.onclick = async () => {
            if (action === 'restar' && carrito[index].cantidad > 1) {
                await actualizarCantidadCarrito(carrito[index].id, carrito[index].cantidad - 1);
            }
            if (action === 'sumar') {
                await actualizarCantidadCarrito(carrito[index].id, carrito[index].cantidad + 1);
            }
            if (action === 'eliminar') {
                await eliminarProductoCarrito(carrito[index].id);
            }
            await cargarCarrito();
        };
    });
}

// Actualiza cantidad en backend (igual que en catalogo.js)
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

// Elimina producto en backend (igual que en catalogo.js)
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
                productoActual.precio
            );
        }

        // Muestra el sidebar con el carrito actualizado
        var myOffcanvas = new bootstrap.Offcanvas(document.getElementById('carritoOffcanvas'));
        myOffcanvas.show();
        await cargarCarrito();
    };
});