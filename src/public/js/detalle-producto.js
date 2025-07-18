// Utilidad para obtener parámetro de URL (?id=)
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

let productoActual = null;

// Cargar los datos del producto seleccionado
async function cargarProductoDetalle() {
    const id = parseInt(getQueryParam('id') || '1'); // Por defecto, producto 1
    const res = await fetch('/api/productos');
    const productos = await res.json();
    const prod = productos.find(p => p.id === id);

    if (!prod) {
        document.getElementById('producto-nombre').textContent = "Producto no encontrado";
        document.getElementById('btn-agregar-carrito').disabled = true;
        return;
    }
    productoActual = prod;

    // Renderizar datos del producto
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
}

// Manejo de cantidad (igual que catálogo)
let cantidad = 1;
document.addEventListener('DOMContentLoaded', () => {
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

        // Volumen seleccionado (en el MVP solo como visual, no backend)
        const volumen = document.getElementById('producto-volumen').value;

        // Repetimos la llamada a agregarAlCarrito la cantidad de veces elegida
        for (let i = 0; i < cantidad; i++) {
            await agregarAlCarrito(
                productoActual.id,
                productoActual.nombre + ` (${volumen} ml)`,
                productoActual.precio
            );
        }

        // Mostrar el sidebar actualizado (idéntico a catálogo)
        var myOffcanvas = new bootstrap.Offcanvas(document.getElementById('carritoOffcanvas'));
        myOffcanvas.show();
        renderCarritoLateral();
    };
});