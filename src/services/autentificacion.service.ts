import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {llaves} from '../config/llaves';
import {Usuario} from '../models';
import {UsuarioRepository} from '../repositories';
// importamos esto ya que descargamos los paquetes
const generador = require('password-generator');
const cryptoJS = require('crypto-js');
const jwt = require("jsonwebtoken");


@injectable({scope: BindingScope.TRANSIENT})
export class AutentificacionService {
  constructor(
    // importamos nuestro repositorio y siempre empesamos a escribir y le damos clip ensima para que el
    // importe de una vez lo de arriba recuerde que esto es la lista o base de datos de usuarios
    @repository(UsuarioRepository)
    public UsuarioRepository: UsuarioRepository
  ) { }

  /*
   * Add service methods here
   */
  // se crean  estas funciones para crear clave y retornarla
  GenerarClave() {
    let clave = generador(8, false);
    return clave;
  }
  // se crean  estas funciones para cifrar clave y retornarla
  cifrarClave(clave: string) {
    let claveCifrada = cryptoJS.MD5(clave).toString();
    return claveCifrada;
  }
  // hacer el metodo de autentica usuario
  identificarUsuario(usuario: string, clave: string) {
    try {
      let u = this.UsuarioRepository.findOne({where: {correo: usuario, contrasena: clave}});
       if (u) {
        return u;
      }
        return false;
    } catch {
      return false;
     }
  }

  GenerarTokenJWT(usuario: Usuario) {
    let token = jwt.sign({
      data: {
        /// si quisieramos incluir los roles tocaria ponerlos aqui como un atributo mas o al final de la linea 51
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre + " " + usuario.apellido
        //expiracion se puede poner tiempo en segundo si uno quiere ademas puede poner todos los atributos de usuario
      },

    },
      llaves.claveJWT)
    return token;
  }
  ValidarTokenJWT(token: string) {
    try {
      let datos = jwt.verify(token, llaves.claveJWT);
      return datos;

    } catch {
      return false;
  }
}
}

