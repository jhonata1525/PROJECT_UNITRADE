import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Encabezado } from '../componentes/comunes/Encabezado';
import { AuthContext } from '../contexto/ContextoAutenticacion';

describe('Test Setup', () => {
  it('renders Encabezado with UniTrade', () => {
    render(
      <AuthContext.Provider value={{ usuario: null, token: null, login: vi.fn(), logout: vi.fn(), verificarSesion: vi.fn() }}>
        <Encabezado />
      </AuthContext.Provider>
    );
    expect(screen.getByText('UniTrade')).toBeInTheDocument();
  });
});