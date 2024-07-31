const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const robot = require('robotjs');
const loudness = require('loudness'); 
const { exec } = require('child_process');
const os = require('os');

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

  socket.on('setVolume', (volume) => {
    if (os.platform() === 'win32') {
      // En Windows
      loudness.setVolume(volume).then(() => {
        console.log(`El volumen se ha establecido al ${volume}%`);
        socket.emit('volumeChanged', volume); // Notificar al cliente que el volumen ha cambiado
      }).catch((err) => {
        console.error('Error al cambiar el volumen:', err);
      });
    } else if (os.platform() === 'linux') {
      // En Ubuntu (Linux)
      const command = `pactl set-sink-volume @DEFAULT_SINK@ ${volume}%`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error al cambiar el volumen: ${error}`);
          return;
        }
        console.log(`El volumen se ha establecido al ${volume}%`);
        socket.emit('volumeChanged', volume); // Notificar al cliente que el volumen ha cambiado
      });
    } 
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Escucha en todas las interfaces de red
server.listen(PORT, HOST, () => console.log(`Server running on port ${PORT}`));
