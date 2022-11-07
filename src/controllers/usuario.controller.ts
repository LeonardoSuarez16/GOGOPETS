import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import fetch from 'node-fetch';
import {Credenciales, Usuario} from '../models';
import {UsuarioRepository} from '../repositories';
import {AutentificacionService} from '../services';

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    // debemos injectar un servicio en esta para eso no olvidemos dar clip encima de
    // autentificacionService par que este importe directamente arriba en (usuario.controller.ts)
    @service(AutentificacionService)
    public servicioAutentificacion : AutentificacionService
  ) {}
// creamos esta funcion que apesar de estar escripta de otra manera es lo mismo  que la funcion de abajo
  // por lo tanto se puede hacer de las dos formas
  @post('/identificarUsuario', {
    responses: {
      '200': {
        decription: 'Identificacion de usuario'
      }
    }
  })

  async identificarUsuario(
    @requestBody() Credenciales : Credenciales
  ){
    let u = await this.servicioAutentificacion.identificarUsuario(Credenciales.usuario, Credenciales.clave);
    if (u) {
      let token = this.servicioAutentificacion.GenerarTokenJWT(u);
      return {
        datos: {
          nombre: u.nombre,
          apellido: u.apellido,
          celular: u.celular,
          correo: u.correo,
          id: u.id
        },
        tk : token
      }
    } else {
      throw new HttpErrors[401]('los datos son invalidos');
    }
  }


  @post('/usuarios')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, 'id'>,
  ): Promise<Usuario> {
    // siempre que vamos a generar una persona toca generar una clave y encriptar esta por MD5 y este tiene encriptadores en  google
    let clave = this.servicioAutentificacion.GenerarClave();
    let claveCifrada = this.servicioAutentificacion.cifrarClave(clave);
    usuario.contrasena = claveCifrada
    let p = await this.usuarioRepository.create(usuario)

    // metodo para notificar al usuario

    let destino = usuario.correo;
    let asunto = 'credenciales de acceso al sistema';
    let contenido = `Hola ${usuario.nombre}, su usuario es : ${usuario.correo} y su contrasena es: ${clave} `;
    fetch(`http://127.0.0.1:5000/envio-correo?correo_destino=${destino}&asunto=${asunto}&contenido=${contenido}`)
      .then((data:any) => {
        console.log(data);
        console.log("listo la tarea");
      })
    return p;
  }

  @get('/usuarios/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }

  @get('/usuarios')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuarios')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }

  @get('/usuarios/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuarios/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }
}
