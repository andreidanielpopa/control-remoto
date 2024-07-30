const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const robot = require('robotjs');
const loudness = require('loudness'); // Importar la librería loudness
const os = require('os'); // Importar el módulo os

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('mouseMove', (data) => {
    const { deltaX, deltaY } = data;
    const mouse = robot.getMousePos();
    const newX = mouse.x + deltaX;
    const newY = mouse.y + deltaY;
    robot.moveMouse(newX, newY);
  });

  socket.on('mouseClick', () => {
    robot.mouseClick();
  });

  socket.on('textInput', (text) => {
    robot.typeString(text);
  });

  socket.on('keyPress', (key) => {
    if (key === 'Enter') {
      robot.keyTap('enter');
    } else if (key === 'Backspace') {
      robot.keyTap('backspace');
    } else if (key === 'Tab') {
      robot.keyTap('tab');
    } else if (key === 'Escape') {
      robot.keyTap('escape');
    } else {
      robot.keyTap(key.toLowerCase());
    }
  });

  // Nuevo evento para cambiar el volumen
  socket.on('setVolume', (volume) => {
    const platform = os.platform();
    console.log(`Plataforma detectada: ${platform}`);

    // Ajustar el volumen según la plataforma
    loudness.setVolume(volume).then(() => {
      console.log(`El volumen se ha establecido al ${volume}%`);
      socket.emit('volumeChanged', volume); // Notificar al cliente que el volumen ha cambiado
    }).catch((err) => {
      console.error('Error al cambiar el volumen:', err);

      // Salida adicional para depuración
      const { command, exitCode, stdout, stderr } = err;
      console.error('Comando:', command);
      console.error('Código de salida:', exitCode);
      console.error('Salida estándar:', stdout);
      console.error('Error estándar:', stderr);

      // Intentar con un comando específico para Linux si estamos en Linux
      if (platform === 'linux') {
        const exec = require('child_process').exec;
        const command = `amixer set IEC958 ${volume}%`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error al ejecutar el comando amixer: ${error.message}`);
            console.error(`stderr: ${stderr}`);
          } else {
            console.log(`El volumen se ha establecido al ${volume}% utilizando amixer`);
            socket.emit('volumeChanged', volume);
          }
        });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Escucha en todas las interfaces de red
server.listen(PORT, HOST, () => console.log(`Server running on port ${PORT}`));
