export interface AuthorStamp {
    created_by?: string | null;
    created_by_name?: string | null;
    updated_by?: string | null;
    updated_by_name?: string | null;
    updated_at?: string | null;
}
export interface ActivityEntry {
    id: string; created_at: string; actor_id: string | null; actor_name: string;
    table_name: string; record_id: string; resource_table: string; resource_id: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE'; changed_fields: string[];
}

export interface HistorialCambio extends AuthorStamp {
    id: number;
    incidencia_id: number;
    nuevo_estado: string;
    created_at: string;
}

export interface Incidencia extends AuthorStamp {
    id: number;
    created_at: string;
    seccion: string;
    titulo: string;
    descripcion?: string | null;
    contestacion?: string | null;
    estado: string;
    creada_por?: string | null;
    historial_cambios?: HistorialCambio[];
}

export interface SaludLaboral extends AuthorStamp {
    id: string; // UUID
    created_at: string;
    seccion: string;
    titulo: string;
    descripcion: string;
    contestacion?: string | null;
    estado: string;
    creada_por?: string;
    imagen_url?: string | null;
    historial_salud?: (AuthorStamp & {
        id: string; // UUID
        salud_id: string; // UUID
        cambio: string;
        created_at: string;
    })[];
}

export interface GestionAfiliado extends AuthorStamp {
    id: string;
    created_at: string;
    afiliado_id: string;
    gestion: string;
}

export interface Afiliado extends AuthorStamp {
    id: string; // UUID
    created_at: string;
    nombre_completo: string;
    seccion: string;
    dni?: string | null;
    nombre?: string | null;
    apellidos?: string | null;
    via?: string | null;
    direccion?: string | null;
    numero?: string | null;
    piso?: string | null;
    codigo_postal?: string | null;
    localidad?: string | null;
    fecha_nacimiento?: string | null;
    pais?: string | null;
    categoria?: string | null;
    estado_pago?: string | null;
    telefono_fijo?: string | null;
    telefono_movil?: string | null;
    correo_electronico?: string | null;
    telefono?: string | null;
    estado_afiliacion: 'activa' | 'baja';
    ausencia_detectada_en?: string | null;
    motivo_baja?: string | null;
    gestiones_afiliados?: GestionAfiliado[];
}
