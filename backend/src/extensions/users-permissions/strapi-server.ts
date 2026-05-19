export default (plugin: any) => {
  // 1. Sobrecargar o endpoint /users/me para retornar sempre os GoPoints e dados da morada
  plugin.controllers.user.me = async (ctx: any) => {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Carrega o utilizador com a relação go_point populada
    const userWithRelation = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['go_point'],
    });

    if (!userWithRelation) {
      return ctx.notFound('User not found');
    }

    const { sanitize } = strapi.plugin('users-permissions').service('user');
    ctx.body = await sanitize(userWithRelation);
  };

  // 2. Sobrecargar o endpoint /users/:id para permitir atualizações de perfil seguras
  plugin.controllers.user.update = async (ctx: any) => {
    const loggedInUser = ctx.state.user;
    if (!loggedInUser) {
      return ctx.unauthorized('You must be logged in');
    }

    const targetId = Number(ctx.params.id);
    // Para segurança, clientes apenas podem atualizar o seu próprio perfil
    if (loggedInUser.id !== targetId) {
      return ctx.forbidden('You can only update your own profile');
    }

    const body = ctx.request.body;
    // Suporta payloads planos e empacotados em { data: { ... } }
    const updateData = body.data ? body.data : body;

    // Filtrar apenas campos autorizados a serem editados pelo próprio cliente
    const allowedFields = [
      'firstName',
      'lastName',
      'phone',
      'nif',
      'defaultAddress',
      'defaultPostalCode',
      'defaultCity',
      'username',
      'email',
      'initials'
    ];

    const cleanData: any = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        cleanData[key] = updateData[key];
      }
    }

    // Preservar username e email caso não sejam alterados
    if (!cleanData.username) cleanData.username = loggedInUser.username;
    if (!cleanData.email) cleanData.email = loggedInUser.email;

    // Atualizar utilizador via entityService
    const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', targetId, {
      data: cleanData,
      populate: ['go_point']
    });

    const { sanitize } = strapi.plugin('users-permissions').service('user');
    ctx.body = await sanitize(updatedUser);
  };

  return plugin;
};
