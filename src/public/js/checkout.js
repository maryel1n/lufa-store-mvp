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
            
            // Deshabilitar botón para evitar múltiples envíos
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Procesando...';
            
            try {
                const response = await fetch('/api/comprar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success && data.redirect_url) {
                    // Redirigir a la pasarela de pagos
                    window.location.href = data.redirect_url;
                } else {
                    // Restaurar botón y mostrar error
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    alert(data.message || 'Error procesando la compra');
                }
            } catch (error) {
                console.error('Error procesando compra:', error);
                // Restaurar botón en caso de error
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                alert('Error procesando la compra. Intente nuevamente.');
            }
        });
    }
});