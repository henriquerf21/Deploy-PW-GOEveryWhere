/**
 * Caminhos de ficheiros servidos a partir de /public (URL absoluta na raiz do site).
 * Ao mover pastas em public/media/, atualiza apenas aqui e o build mantém-se coerente.
 */
export const MEDIA = {
  brandLogo: '/media/brand/logo-goeverywhere.png',
  /** Landing GoGummies (imagens em /public/media/gogummies/) */
  gogummies: {
    heroJar: '/media/gogummies/hero-jar.png',
    heroProduct: '/media/gogummies/hero-product.png',
    heroGym: '/media/gogummies/hero-gym.png',
    productDetail: '/media/gogummies/product-detail.png',
  },
  /** Vídeo do carrossel de serviços (About) */
  servicesCarouselVideo: '/media/services/carousel.mp4',
  /** Frame PNG da sequência scroll-driven (About) */
  aboutScrollFrame: (index) =>
    `/media/about/scroll-frames/frame-${String(index).padStart(3, '0')}.png`,
  /** Máscara CSS do painel de vídeo do carrossel */
  aboutVideoMask: '/media/about/mask-panel.png',
};
