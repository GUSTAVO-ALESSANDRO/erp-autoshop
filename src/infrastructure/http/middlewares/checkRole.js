// Middleware para restringir o acesso a rotas com base nos papéis (roles) do usuário
export function checkRole(allowedRoles = []) {
  return (req, res, next) => {
    // Garante que o usuário foi autenticado previamente pelo verifyToken
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        status: 'error',
        message: 'Acesso não autorizado. Usuário não autenticado.'
      });
    }

    const userRole = req.user.role;

    // Verifica se o papel do usuário está na lista de papéis permitidos para a rota
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: 'error',
        message: 'Acesso proibido. Você não possui permissão para acessar este recurso.'
      });
    }

    // Permite que a requisição prossiga caso o papel seja válido
    return next();
  };
}