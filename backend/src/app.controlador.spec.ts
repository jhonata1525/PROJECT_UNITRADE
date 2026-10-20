import { Test, TestingModule } from '@nestjs/testing';
import { ControladorApp } from './app.controlador.js';
import { ServicioApp } from './app.servicio.js';

describe('ControladorApp', () => {
  let controlador: ControladorApp;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ControladorApp],
      providers: [ServicioApp],
    }).compile();

    controlador = app.get<ControladorApp>(ControladorApp);
  });

  describe('raíz', () => {
    it('debe devolver el saludo de la API', () => {
      expect(controlador.obtenerSaludo()).toBe('UniTrade API funcionando');
    });
  });
});
