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
    updated_at?: string;
    gestiones_afiliados?: GestionAfiliado[];
}
