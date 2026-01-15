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
    estado: string;
    creada_por?: string | null;
    historial_cambios?: HistorialCambio[];
}
