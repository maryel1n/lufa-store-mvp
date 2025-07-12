# 🧪 Tarjetas de Prueba - Pasarela de Pagos Lufa Store

## 📋 Guía de Tarjetas de Prueba

Este documento lista todas las tarjetas de prueba disponibles para testing de la pasarela de pagos.

---

## ✅ TARJETAS APROBADAS (Siempre autorizan)

| Número | Tipo | Descripción |
|--------|------|-------------|
| `4111 1111 1111 1111` | Visa | Tarjeta de prueba estándar |
| `4000 0000 0000 0002` | Visa | Tarjeta aprobada |
| `5555 5555 5555 4444` | MasterCard | Tarjeta de prueba estándar |
| `5200 0000 0000 0007` | MasterCard | Tarjeta aprobada |
| `378282246310005` | American Express | Tarjeta corporativa |
| `4000 0000 0000 0101` | Visa | Límite alto |
| `5105 1051 0510 5100` | MasterCard | Tarjeta premium |

---

## ❌ TARJETAS RECHAZADAS

### 💰 Por Fondos Insuficientes
| Número | Tipo | Error |
|--------|------|-------|
| `4000 0000 0000 0127` | Visa | "Fondos insuficientes" |
| `5200 0000 0000 0049` | MasterCard | "Fondos insuficientes" |

### 🚫 Por Tarjeta Robada/Perdida
| Número | Tipo | Error |
|--------|------|-------|
| `4000 0000 0000 0119` | Visa | "Tarjeta reportada como robada o perdida" |
| `4000 0000 0000 0259` | Visa | "Tarjeta reportada como robada o perdida" |
| `5200 0000 0000 0114` | MasterCard | "Tarjeta reportada como robada o perdida" |

### 🔒 Por CVV Incorrecto
| Número | CVV Especial | Error |
|--------|--------------|-------|
| `4000 0000 0000 0101` | `000` | "Código CVV incorrecto" |
| `4242 4242 4242 4241` | `000` | "Código CVV incorrecto" |

### 🛡️ Requieren 3D Secure
| Número | Tipo | Comportamiento |
|--------|------|----------------|
| `4000 0000 0000 0044` | Visa | "Requiere autenticación 3D Secure" |
| `5200 0000 0000 0056` | MasterCard | "Requiere autenticación 3D Secure" |

---

## 🎯 REGLAS AUTOMÁTICAS

### Por Último Dígito
- **Terminadas en 0 o 9**: Rechazadas por "Límite de crédito excedido"
- **Otras terminaciones**: Aprobadas (si no están en listas específicas)

### Por Monto
- **Más de $500,000**: Rechazadas por "Monto excede límite permitido"
- **Menos de $500,000**: Procesadas según reglas de tarjeta

---

## 🧪 DATOS DE PRUEBA VÁLIDOS

### Nombres de Titular
- Cualquier nombre (mínimo 2 caracteres)
- Ejemplos: `Juan Pérez`, `María González`, `Test User`

### Fechas de Vencimiento
- Cualquier fecha futura en formato `MM/AA`
- Ejemplos: `12/25`, `06/26`, `01/30`

### CVV
- Cualquier código de 3-4 dígitos
- **Excepción**: Usa `000` para simular CVV incorrecto en tarjetas específicas

---

## 🎮 ESCENARIOS DE PRUEBA RECOMENDADOS

### ✅ Flujo Exitoso
1. Usa `4111 1111 1111 1111`
2. Nombre: `Juan Pérez`
3. Vencimiento: `12/25`
4. CVV: `123`

### ❌ Fondos Insuficientes
1. Usa `4000 0000 0000 0127`
2. Cualquier nombre válido
3. Fecha futura
4. CVV válido

### 🚫 Tarjeta Robada
1. Usa `4000 0000 0000 0119`
2. Cualquier nombre válido
3. Fecha futura
4. CVV válido

### 🔒 CVV Incorrecto
1. Usa `4000 0000 0000 0101`
2. Cualquier nombre válido
3. Fecha futura
4. CVV: `000`

### 💳 Límite Excedido
1. Usa cualquier tarjeta terminada en `0` (ej: `4111 1111 1111 1110`)
2. Cualquier nombre válido
3. Fecha futura
4. CVV válido

---

## 🔧 DESARROLLO Y TESTING

### Para QA/Testing
- Usa estas tarjetas para probar todos los flujos de error
- Verifica que los mensajes de error sean claros
- Confirma que los pagos aprobados procesen correctamente el stock

### Para Desarrollo
- Todas las tarjetas pasan validación de Luhn
- Los datos nunca se almacenan (solo últimos 4 dígitos)
- Estados de transacción: `CREATED` → `AUTHORIZED/REJECTED`

---

## ⚠️ IMPORTANTE

- **Solo para testing**: Estas tarjetas NO funcionan en producción
- **Datos simulados**: No son números de tarjetas reales
- **Seguridad**: En producción usar tokenización y encriptación real
- **PCI DSS**: Implementar cumplimiento completo para datos reales

---

*Última actualización: Diciembre 2024*