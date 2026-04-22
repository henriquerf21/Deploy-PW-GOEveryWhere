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

  bootstrap() {},
};