import type { Role } from '@maprix/types';
import type { Area } from '@/components/shell/nav-items';

/**
 * A role do usuário ('engenheiro'|'cartorio') e a área de navegação
 * ('engenharia'|'cartorio') têm rótulos diferentes — este mapa faz a ponte.
 */
export const ROLE_AREA: Record<Role, Area> = {
  engenheiro: 'engenharia',
  cartorio: 'cartorio',
};

/** Página inicial de cada role após o login. */
export const ROLE_HOME: Record<Role, string> = {
  engenheiro: '/engenharia/conversor',
  cartorio: '/cartorio/matriculas',
};
