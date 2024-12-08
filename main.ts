/*
Se desarrollará una API para gestionar proyectos, tareas y usuarios. Esta API permitirá a los usuarios registrarse, crear proyectos, asignar tareas, y registrar avances en estas tareas.

Modelos de Datos
  1. Usuario
    - Representa a un usuario registrado en el sistema.
    - Atributos:
      - id (ObjectId): Identificador único del usuario.
      - name (string): Nombre del usuario, obligatorio.
      - email (string): Correo electrónico único del usuario, obligatorio.
      - created_at (Date): Fecha de creación del usuario, por defecto la fecha actual.
    
  2. Proyecto
    - Representa un proyecto gestionado en el sistema.
    - Atributos:
      - id (ObjectId): Identificador único del proyecto.
      - name (string): Nombre del proyecto, obligatorio.
      - description (string): Descripción del proyecto, opcional.
      - start_date (Date): Fecha de inicio del proyecto, obligatoria.
      - end_date (Date): Fecha de finalización del proyecto, opcional.
      - user_id (ObjectId): Identificador del usuario propietario del proyecto, obligatorio.

  3. Tarea
    - Representa una tarea asociada a un proyecto.
    - Atributos:
      - id (ObjectId): Identificador único de la tarea.
      - title (string): Título de la tarea, obligatorio.
      - description (string): Descripción detallada de la tarea, opcional.
      - status (string): Estado de la tarea, valores posibles: pending, in_progress, completed. Por defecto: pending.
      - created_at (Date): Fecha de creación de la tarea, por defecto la fecha actual.
      - due_date (Date): Fecha de vencimiento de la tarea, opcional.
      - project_id (ObjectId): Identificador del proyecto al que pertenece la tarea, obligatorio.

Relaciones entre los Modelos
  1. Un usuario puede tener varios proyectos asignados.
  2. Relación de uno a muchos entre Usuario y Proyecto (un usuario puede ser propietario de muchos proyectos).
  3. Un proyecto pertenece a un único usuario, pero puede contener varias tareas.
  4. Relación de uno a muchos entre Proyecto y Tarea (un proyecto puede incluir muchas tareas).
  5. Una tarea pertenece a un único proyecto.
  6. Relación de uno a uno entre Tarea y Proyecto (una tarea está siempre vinculada a un solo proyecto).

Rutas de la API
  1. Usuarios
    GET /users
      - Devuelve la lista de todos los usuarios registrados.
    POST /users
      - Crea un nuevo usuario.
    DELETE /users
      - Elimina un usuario específico. Requiere el parámetro id en la query string.

  2. Proyectos
    GET /projects
      - Devuelve la lista de todos los proyectos registrados.
    POST /projects
      - Crea un nuevo proyecto.
    DELETE /projects
      - Elimina un proyecto específico. Requiere el parámetro id en la query string.

  3. Tareas
    GET /tasks
      - Devuelve la lista de todas las tareas registradas.
    POST /tasks
      - Crea una nueva tarea.
    DELETE /tasks
      - Elimina una tarea específica. Requiere el parámetro id en la query string.

  4. Mover Tarea entre Proyectos
      POST /tasks/move
        - Mueve una tarea de un proyecto a otro. Los parámetros task_id, destination_project_id y, opcionalmente, origin_project_id deben enviarse en el cuerpo de la solicitud.
          - El parámetro task_id es obligatorio y representa la tarea a mover.
          - El parámetro destination_project_id es obligatorio y representa el proyecto de destino.
          - El parámetro origin_project_id es opcional; si se omite, se asumirá que la tarea no está asociada a ningún proyecto de origen.
  
  5. Ver Tareas por Proyecto
      GET /tasks/by-project
        - Devuelve todas las tareas asociadas a un proyecto. Requiere el parámetro project_id en la query string.
  
  6. Ver Proyectos por Usuario
      GET /projects/by-user
        - Devuelve todos los proyectos asociados a un usuario. Requiere el parámetro user_id en la query string.
*/

import { MongoClient, ObjectId } from "mongodb";
import { ProjectModel, TaskModel, UserModel } from "./types.ts";
import { fromModelToProject, fromModelTotask, fromModelToUser } from "./utils.ts";


const MONGO_URL = Deno.env.get("MONGO_URL");
if(!MONGO_URL){
  //Lanzo una excepecion para que pueda ejecutarse el programa en deno deploy, si pongo el Deno.exit(1) me salta un error y no se ejecuta
  throw new Error("Debes crear la variable de entorno MONGO_URL");

  //console.log("Debes crear la variable de entorno MONGO_URL");
  //Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.log("Conectado a la base de datos");

const db = client.db("practica4");

//Crear la cooleccion de usuarios. Se crean automaticamente si no existen cuando se inserta un documento.
const UsersCollection = db.collection<UserModel>("users");
const TasksCollection = db.collection<TaskModel>("tasks");
const ProjectsCollection = db.collection<ProjectModel>("projects");

const handler = async (req: Request): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;
  const searchParams = url.searchParams;

  if(method === "GET"){
    if(path === "/users"){
      const usersDB = await UsersCollection.find().toArray();
      const users = await Promise.all(usersDB.map((u) => fromModelToUser(u)));
      return new Response(JSON.stringify(users), { status: 200 });

    } else if(path === "/projects"){
      const projectsDB = await ProjectsCollection.find().toArray();
      const projects = await Promise.all(projectsDB.map((p) => fromModelToProject(p)));
      return new Response(JSON.stringify(projects), { status: 200 });

    }else if(path === "/tasks"){
      const tasksDB = await TasksCollection.find().toArray();
      const tasks = await Promise.all(tasksDB.map((t) => fromModelTotask(t)));
      return new Response(JSON.stringify(tasks), { status: 200 });

    }else if(path === '/tasks/by-project'){
      const pid = searchParams.get('project_id');
      if(!pid) return new Response("Bad Request", {status: 404});
      const projectid = new ObjectId(pid); 

      const tasksdb = await TasksCollection.find({project_id: projectid}).toArray();
      const tasks = await Promise.all(tasksdb.map(t => fromModelTotask(t)));
      return new Response(JSON.stringify(tasks), {status: 200});

    }else if(path === '/projects/by-user'){
      const uid = searchParams.get('user_id');
      if(!uid) return new Response("Bad Request", {status: 404});
      const userid = new ObjectId(uid);

      const projectsdb = await ProjectsCollection.find({user_id: userid}).toArray();
      const projects = await Promise.all(projectsdb.map(p => fromModelToProject(p)));
      return new Response(JSON.stringify(projects), {status: 200});
    }


  } else if(method === "POST"){
    if(path === "/users"){
      const user = await req.json();
      if(!user.name || !user.email){
        return new Response("Bad request", { status: 400 });
      }

      const userDB = await UsersCollection.findOne({ email: user.email });
      if(userDB) return new Response("User already exists", { status: 409 });

      const { insertedId } = await UsersCollection.insertOne({
        name: user.name,
        email: user.email,
        created_at: new Date()
      });

      return new Response(JSON.stringify({
        name: user.name,
        email: user.email,
        created_at: new Date(),
        id: insertedId
      }), { status: 201 });


    }else if(path === "/projects"){
      const project = await req.json();
      if(!project.name || !project.start_date || !project.user_id){
        return new Response("Bad request", { status: 400 });
      }

      const idUser = await UsersCollection.find({ _id: project.user_id });
      if(!idUser) return new Response("User not found", { status: 404 });

      const { insertedId } = await ProjectsCollection.insertOne({
        name: project.name,
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date,
        user_id: new ObjectId(project.user_id as string)
      });

      return new Response(JSON.stringify({
        name: project.name,
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date,
        user_id: project.user_id,
        id: insertedId
      }), { status: 201 });


    }else if(path === "/tasks"){
      const task = await req.json();
      if(!task.title  || !task.status || !task.due_date || !task.project_id){
        return new Response("Bad request", { status: 400 });
      }

      const idProject = await ProjectsCollection.find({ _id: task.project_id });
      if(!idProject) return new Response("Project not found", { status: 404 });

      const { insertedId } = await TasksCollection.insertOne({
        title: task.title,
        description: task.description,
        status: task.status,
        created_date: task.created_date,
        due_date: task.due_date,
        project_id: new ObjectId(task.project_id as string)
      });

      return new Response(JSON.stringify({
        title: task.title,
        description: task.description,
        status: task.status,
        created_date: task.created_date,
        due_date: task.due_date,
        project_id: task.project_id,
        id: insertedId
      }), { status: 201 });

 
    }else if(path === "/tasks/move"){
      const task = await req.json();
      if(!task.task_id || !task.destination_project_id){
        return new Response("Bad request", { status: 400 });
      }

      const idTask = await TasksCollection.find({ _id: task.task_id });
      if(!idTask) return new Response("Task not found", { status: 404 });

      const idProject = await ProjectsCollection.find({ _id: task.destination_project_id });
      if(!idProject) return new Response("Project not found", { status: 404 });

      const { modifiedCount } = await TasksCollection.updateOne(
        { _id: new ObjectId(task.task_id as string) },
        { $set: { project_id: task.destination_project_id } }
      );

      if(modifiedCount === 0) return new Response("Task not moved", { status: 400 });

      return new Response(JSON.stringify({
        message: "Task moved successfully",
        task: {
          id: task._id,
          title: task.title,
          project_id: task.destination_project_id
        }
      }), { status: 200 });
    }


  }else if(method === "DELETE"){
    if(path === "/users"){
      const id = searchParams.get("id");
      if(!id) return new Response("Bad request", { status: 400 });

      const deletedUser = await UsersCollection.deleteOne({ _id: new ObjectId(id) });
      if(deletedUser.deletedCount === 0) return new Response("User not found", { status: 404 });

      return new Response("User deleted successfully", { status: 200 });

    }else if(path === "/projects"){
      const id = searchParams.get("id");
      if(!id) return new Response("Bad request", { status: 400 });

      const deletedProject = await ProjectsCollection.deleteOne({ _id: new ObjectId(id) });
      if(deletedProject.deletedCount === 0) return new Response("Project not found", { status: 404 });

      return new Response("Project deleted successfully", { status: 200 });

    }else if(path === "/tasks"){
      const id = searchParams.get("id");
      if(!id) return new Response("Bad request", { status: 400 });

      const deletedTask = await TasksCollection.deleteOne({ _id: new ObjectId(id) });
      if(deletedTask.deletedCount === 0) return new Response("Task not found", { status: 404 });

      return new Response("Task deleted successfully", { status: 200 });
    }
  }

  return new Response("Endpoint not found", {status: 404});
}

Deno.serve({port: 3000}, handler);