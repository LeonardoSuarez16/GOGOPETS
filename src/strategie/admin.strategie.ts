
import {AuthenticationStrategy} from '@loopback/authentication';
import {service} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import parseBearerToken from 'parse-bearer-token';
import {AutentificacionService} from '../services';
const jwt = require("jsonwebtoken");



export class EstrategiaAdministrador implements AuthenticationStrategy{
  // en este espacio podemos definir mas estrategias para definir para un vendedor o asesor etc en vex de admin
  //ponemos vendedor o otro
  name: string = 'admin';

constructor(
  @service(AutentificacionService)
  public ServicioAutenticacion: AutentificacionService
) {
  }
  async authenticate(request: Request): Promise<UserProfile | undefined> {
    let token = parseBearerToken(request);
    if (token) {
      let datos = this.ServicioAutenticacion.ValidarTokenJWT(token);
      if (datos) {
        // en esta linea pondriamos los roles depues de data.rol para que supueramos quien lo tiene con la funcion de generaltokenjwt
        if (datos) {
          // en este lugar tendriamos que validar el rol que tendriamos asignados en los datos
          let perfil: UserProfile = Object.assign({
            nombre: datos.data.nombre
          });
          return perfil;
          ///if (datos.data.roles) en caso que queramos poner los rol del usuario
        }
      } else {
        throw new HttpErrors[401]("el token incluido no es valido.")
      }
    } else {
      throw new HttpErrors[401]("no se ha incluido un token en la solicitud.")
    }
  }
}


