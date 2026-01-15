export interface Incidencia {
    id: number;
    created_at: string;
    seccion: string;
    titulo: string;
    descripcion?: string | null;
    estado: string;
    creada_por?: string | null;
}
