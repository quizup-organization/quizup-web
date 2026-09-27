/**
 * Contrats transverses de la surface BFF : pagination, identifiant de création et erreur HTTP.
 */

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface IdResponse {
  id: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  title?: string;
  detail?: string;
}
