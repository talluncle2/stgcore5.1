import { BrandLogo } from "./BrandLogo";

export function LoadingScreen() {
  return (
    <div className="stg-loader" role="status" aria-live="polite" aria-label="Carregando STG">
      <div className="stg-loader__backdrop" />
      <div className="stg-loader__content">
        <BrandLogo
          className="justify-center"
          imageClassName="h-32 w-40 md:h-40 md:w-52"
          showText={false}
        />
        <p className="stg-loader__tag">SUPREMO TRIBUNAL GAMER</p>
        <h1 className="stg-loader__title">STG WARZONE LEAGUE</h1>

        <div className="stg-loader__scanline" />

        <div className="stg-loader__ring-wrap" aria-hidden="true">
          <span className="stg-loader__ring stg-loader__ring--outer" />
          <span className="stg-loader__ring stg-loader__ring--inner" />
          <span className="stg-loader__core" />
        </div>

        <div className="stg-loader__progress" aria-hidden="true">
          <span className="stg-loader__progress-fill" />
        </div>

        <p className="stg-loader__status">Sincronizando operadores e arenas...</p>
      </div>
    </div>
  );
}
