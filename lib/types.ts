export interface HistorialCambio {
    id: number;
    incidencia_id: number;
    nuevo_estado: string;
    created_at: string;
}

export interface Incidencia {
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

export interface SaludLaboral {
    id: string; // UUID
    created_at: string;
    seccion: string;
    titulo: string;
    descripcion: string;
    contestacion?: string | null;
    estado: string;
    creada_por?: string;
    imagen_url?: string | null;
    historial_salud?: {
        id: string; // UUID
        salud_id: string; // UUID
        cambio: string;
        created_at: string;
    }[];
}

export interface GestionAfiliado {
    id: string;
    created_at: string;
    afiliado_id: string;
    gestion: string;
}

export interface Afiliado {
    id: string; // UUID
    created_at: string;
    nombre_completo: string;
    seccion: string;
    dni?: string;
    direccion?: string;
    codigo_postal?: string;
    localidad?: string;
    telefono?: string;
    gestiones_afiliados?: GestionAfiliado[];
}
