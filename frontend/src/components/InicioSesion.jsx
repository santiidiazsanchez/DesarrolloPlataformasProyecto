import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { iniciarSesion } from '../services/api';

export default function InicioSesion({ aviso, onIngresar }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function enviar(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    setEnviando(true);
    setError('');
    try {
      onIngresar(await iniciarSesion(datos.get('correo'), datos.get('password')));
    } catch (error) {
      setError(error.message);
      // Por seguridad se limpia la contraseña; el correo se conserva para corregir solo lo necesario.
      formulario.elements.password.value = '';
      setTimeout(() => formulario.elements.password.focus());
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main id="contenido" className="max-w-md mx-auto px-5 py-10" tabIndex={-1}>
      <Card>
        <CardHeader>
          <CardTitle><h2 className="text-lg">Iniciar sesión</h2></CardTitle>
          <CardDescription>Ingresa con tu cuenta para consultar y gestionar los incidentes.</CardDescription>
        </CardHeader>
        <CardContent>
          {aviso && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4 text-sm text-amber-900">{aviso}</p>}
          <form onSubmit={enviar} className="space-y-4">
            <fieldset disabled={enviando} className="space-y-4 min-w-0">
              <legend className="sr-only">Credenciales</legend>
              <div>
                <label htmlFor="correo-sesion">Correo</label>
                <Input id="correo-sesion" name="correo" type="email" required maxLength={120} autoComplete="username" placeholder="analista@incidentes.local" />
              </div>
              <div>
                <label htmlFor="password">Contraseña</label>
                <Input id="password" name="password" type="password" required maxLength={72} autoComplete="current-password" />
              </div>
              {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full">{enviando ? 'Verificando…' : 'Ingresar'}</Button>
            </fieldset>
          </form>
          <p className="text-xs text-muted-foreground mt-4">Cuentas de prueba: admin, supervisor y analista @incidentes.local. Las contraseñas están en el informe de entrega (en local, en el archivo .env).</p>
        </CardContent>
      </Card>
    </main>
  );
}
