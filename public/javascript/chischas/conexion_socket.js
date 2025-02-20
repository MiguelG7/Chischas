
// Conexión con el servidor Socket.IO
const socket = io();
socket.emit('chat message', (String("Invitado "+ "se ha conectado")));
// Referencias a elementos del DOM
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

// Enviar mensaje al servidor al enviar el formulario
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Evitar recargar la página
    if (input.value) {
        socket.emit('chat message', (String("Invitado "+ input.value))); // Enviar mensaje al servidor
    }
    input.value = ''; // Limpiar el campo de entrada
});

// Escuchar mensajes del servidor
socket.on('chat message', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg; // Mostrar mensaje recibido
    messages.appendChild(item);

    // Desplazar automáticamente hacia el último mensaje
    messages.scrollTop = messages.scrollHeight;
});
