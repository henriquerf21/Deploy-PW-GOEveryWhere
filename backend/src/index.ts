export default {
  register({ strapi }: { strapi: any }) {
    const authController = strapi.plugin('users-permissions').controller('auth');
    const originalCallback = authController.callback;

    authController.callback = async (ctx: any) => {
      const provider = ctx.params.provider;

      await originalCallback(ctx);

      if (provider === 'google' && ctx.response.status === 200 && ctx.response.body.user) {
        const userId = ctx.response.body.user.id;
        const accessToken = ctx.query.access_token;

        if (accessToken) {
          try {
            const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
            const googleData: any = await googleResponse.json();

            const photoUrl = googleData.picture;

            if (photoUrl) {
              await strapi.entityService.update('plugin::users-permissions.user', userId, {
                data: { picture: photoUrl },
              });

              ctx.response.body.user.picture = photoUrl;
            }
          } catch (error) {
            strapi.log.error('Failed to fetch Google profile picture', error);
          }
        }
      }
    };
  },

  async bootstrap({ strapi }: { strapi: any }) {
    try {
      await ensureUploadPermissions(strapi);
    } catch (err) {
      strapi.log.warn('[BO] não foi possível garantir permissões de upload automaticamente', err);
    }
  },
};

async function ensureUploadPermissions(strapi: any) {
  const roles = await strapi.db.query('plugin::users-permissions.role').findMany();
  for (const role of roles) {
    if (!['authenticated', 'public'].includes(role.type)) continue;
    const actionsToGrant = [
      'plugin::upload.content-api.upload',
      'plugin::upload.content-api.find',
      'plugin::upload.content-api.findOne',
    ];
    for (const action of actionsToGrant) {
      const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { action, role: role.id },
      });
      if (!existing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action, role: role.id },
        });
        strapi.log.info(`[BO] permissão ${action} criada para o role ${role.type}`);
      }
    }
  }
}