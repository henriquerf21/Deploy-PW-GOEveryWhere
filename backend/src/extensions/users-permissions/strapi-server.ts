export default (plugin: any) => {
  const sanitizeOutput = async (user: any, ctx: any) => {
    const schema = strapi.getModel('plugin::users-permissions.user');
    const { auth } = ctx.state;
    return strapi.contentAPI.sanitize.output(user, schema, { auth });
  };

  // 1. Sobrecargar o endpoint /users/me para retornar sempre os GoPoints
  plugin.controllers.user.me = async (ctx: any) => {
    const authUser = ctx.state.user;
    if (!authUser) {
      return ctx.unauthorized('You must be logged in');
    }

    // Usar entityService garante que o populate funciona corretamente na v5
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', authUser.id, {
      populate: ['go_point', 'role']
    });


    if (!user) {
      return ctx.notFound('User not found');
    }

    const sanitized: any = await sanitizeOutput(user, ctx);
    
    // Forçar a inclusão do go_point para evitar que o sanitizador o remova
    if (user.go_point) {
      sanitized.go_point = user.go_point;
    } else {
      sanitized.go_point = null;
    }

    ctx.body = sanitized;
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
      'initials',
      'picture' // Incluir picture para evitar perda do avatar nos updates!
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

    // Atualizar utilizador via serviço edit padrão (garante hash da password e outras regras do plugin)
    await strapi.plugin('users-permissions').service('user').edit(targetId, cleanData);

    // Procurar o utilizador atualizado com go_point e role populados
    const updatedUser = await strapi.entityService.findOne('plugin::users-permissions.user', targetId, {
      populate: ['go_point', 'role']
    });

    const sanitized: any = await sanitizeOutput(updatedUser, ctx);

    // Forçar a inclusão do go_point
    if (updatedUser.go_point) {
      sanitized.go_point = updatedUser.go_point;
    } else {
      sanitized.go_point = null;
    }

    ctx.body = sanitized;
  };

  return plugin;
};
