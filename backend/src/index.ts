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
      // Allow public to search for courier-estafetas (for login)
      const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
      if (publicRole) {
        const permissions = await strapi.db.query('plugin::users-permissions.permission').findMany({
          where: { role: publicRole.id, action: 'api::courier-estafeta.courier-estafeta.find' }
        });
        if (permissions.length === 0) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action: 'api::courier-estafeta.courier-estafeta.find', role: publicRole.id }
          });
        }
      }

      // Allow public to search deliveries
      if (publicRole) {
        const p2 = await strapi.db.query('plugin::users-permissions.permission').findMany({
          where: { role: publicRole.id, action: 'api::delivery.delivery.find' }
        });
        if (p2.length === 0) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action: 'api::delivery.delivery.find', role: publicRole.id }
          });
        }
      }

      // Create or update a default courier
      const existing = await strapi.db.query('api::courier-estafeta.courier-estafeta').findOne({
        where: { phone: '+351222222222' }
      });
      if (!existing) {
        await strapi.db.query('api::courier-estafeta.courier-estafeta').create({
          data: {
            fullName: 'Estafeta Teste',
            phone: '+351222222222',
            password: '123', // Hardcoded simple password for testing
            courier_status: 'E-06 Online',
            zone: 'Porto Centro',
            vehicleType: 'mota',
            publishedAt: new Date()
          }
        });
      } else {
        await strapi.db.query('api::courier-estafeta.courier-estafeta').updateMany({
          where: { phone: '+351222222222' },
          data: { password: '123' }
        });
      }
    } catch (e) {
      console.error('Bootstrap error:', e);
    }
  },
};