/*1. Usuario

Representa a un usuario registrado en el sistema.
Atributos:
id (ObjectId): Identificador único del usuario.
name (string): Nombre del usuario, obligatorio.
email (string): Correo electrónico único del usuario, obligatorio.
created_at (Date): Fecha de creación del usuario, por defecto la fecha actual.
2. Proyecto

Representa un proyecto gestionado en el sistema.
Atributos:
id (ObjectId): Identificador único del proyecto.
name (string): Nombre del proyecto, obligatorio.
description (string): Descripción del proyecto, opcional.
start_date (Date): Fecha de inicio del proyecto, obligatoria.
end_date (Date): Fecha de finalización del proyecto, opcional.
user_id (ObjectId): Identificador del usuario propietario del proyecto, obligatorio.
3. Tarea

Representa una tarea asociada a un proyecto.
Atributos:
id (ObjectId): Identificador único de la tarea.
title (string): Título de la tarea, obligatorio.
description (string): Descripción detallada de la tarea, opcional.
status (string): Estado de la tarea, valores posibles: pending, in_progress, completed. Por defecto: pending.
created_at (Date): Fecha de creación de la tarea, por defecto la fecha actual.
due_date (Date): Fecha de vencimiento de la tarea, opcional.
project_id (ObjectId): Identificador del proyecto al que pertenece la tarea, obligatorio.


Relaciones entre los Modelos
Un usuario puede tener varios proyectos asignados.
Relación de uno a muchos entre Usuario y Proyecto (un usuario puede ser propietario de muchos proyectos).
Un proyecto pertenece a un único usuario, pero puede contener varias tareas.
Relación de uno a muchos entre Proyecto y Tarea (un proyecto puede incluir muchas tareas).
Una tarea pertenece a un único proyecto.
Relación de uno a uno entre Tarea y Proyecto (una tarea está siempre vinculada a un solo proyecto).
*/


import {ObjectId, OptionalId} from 'mongodb';

export type UserModel = OptionalId<{
    _id: ObjectId,
    name: string,
    email: string,
    created_at: Date,

}>;

export type ProjectModel = OptionalId<{
    _id: ObjectId,
    name: string,
    description?: string,
    start_date: Date,
    end_date?: Date,
    user_id: ObjectId,
}>;

export type TaskModel = OptionalId<{
    _id: ObjectId,
    title: string,
    description?: string,
    status: "pending" | 'in-progress' | 'completed',
    created_date: Date,
    due_date?: Date,
    project_id: ObjectId,
}>;


export type User = {
    id: string,
    name: string,
    email: string,
    created_at: Date,
}

export type Project = {
    id: string,
    name: string,
    description?: string,
    start_date: Date,
    end_date?: Date,
    user_id: string,
}


export type Task = {
    id: string,
    title: string,
    description?: string,
    status: "pending" | 'in-progress' | 'completed',
    created_date: Date,
    due_date?: Date,
    project_id: string,
}