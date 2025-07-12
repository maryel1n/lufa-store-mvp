// --- MOSTRAR TOTALES DEL CARRITO EN EL CHECKOUT ---
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

function renderTotalesCheckout() {
    let subtotal = 0;
    carrito.forEach(producto => {
        subtotal += producto.precio * producto.cantidad;
    });
    const envio = carrito.length > 0 ? 4500 : 0;
    const subtotalEl = document.getElementById('subtotalCheckout');
    const envioEl = document.getElementById('envioCheckout');
    const totalEl = document.getElementById('totalCheckout');
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString('es-CL')}`;
    if (envioEl) envioEl.textContent = `$${envio.toLocaleString('es-CL')}`;
    if (totalEl) totalEl.textContent = `$${(subtotal + envio).toLocaleString('es-CL')}`;
}

// --- CONFIRMAR FORMULARIO ---
document.addEventListener('DOMContentLoaded', async function () {
    await cargarCarrito();
    renderTotalesCheckout();

    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            try {
                const response = await fetch('/api/comprar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = '/confirmacion';
                } else {
                    alert(data.message || 'Error procesando la compra');
                }
            } catch (error) {
                console.error('Error procesando compra:', error);
                alert('Error procesando la compra. Intente nuevamente.');
            }
        });
    }
});