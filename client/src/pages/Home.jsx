import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowRight, Calendar } from "lucide-react";
import ScholarshipPhase from "../components/molecules/ScholarshipPhase";

/**
 * PAGE: Home
 * Landing page principal - Muestra fases de becas y timeline
 * Accesible antes de autenticación
 */
const Home = () => {
  const navigate = useNavigate();

  const logoImagePath = "/images/logo-uce.png"; // Logo UCE
  const heroBackgroundImagePath = "/images/hero-becas-bg.jpg"; // Imagen de fondo hero

  // CONTENTFUL ENTRY ID
  const contentfulEntryId = "183igt8xyabheZFyvIH6cn";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-sans">
      {/* HEADER NAVEGACIÓN */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* LOGO DINÁMICO */}
            <img
              src={logoImagePath}
              alt="Logo UCE"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            {/* FALLBACK: si no está la imagen, mostrar icono */}
            <div className="bg-brand-blue p-2 rounded-lg text-white hidden [@media(has(~img[style*='display:none']))]:block">
              <Calendar size={24} />
            </div>
            <h1 className="text-2xl font-bold text-brand-blue">
              Sistema de Becas UCE
            </h1>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-800 font-medium transition-all"
          >
            Ingresar
          </button>
        </div>
      </header>

      {/* HERO SECTION CON IMAGEN DE FONDO */}
      <section
        className="relative text-white py-24 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 76, 129, 0.7), rgba(15, 76, 129, 0.7)), url('${heroBackgroundImagePath}')`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-lg">
            Becas Universitarias UCE
          </h2>
          <p className="text-xl text-blue-100 drop-shadow">
            Conoce el cronograma de fases y participa en nuestro programa de
            becas
          </p>
        </div>
      </section>

      {/* MISIÓN Y VISIÓN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* MISIÓN */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <h3 className="text-2xl font-bold text-brand-blue mb-3">Misión</h3>
            <p className="text-gray-600 leading-relaxed">
              Proporcionar acceso equitativo a becas universitarias que permitan
              a estudiantes meritosos acceder a educación superior de calidad en
              la Universidad Central del Ecuador, fortaleciendo así el talento
              académico nacional.
            </p>
          </div>

          {/* VISIÓN */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <h3 className="text-2xl font-bold text-brand-blue mb-3">Visión</h3>
            <p className="text-gray-600 leading-relaxed">
              Ser un programa de becas líder que impulse la movilidad social y
              la inclusión educativa, reconocido por su transparencia, equidad y
              compromiso con el desarrollo integral de estudiantes talentosos de
              todas las regiones del país.
            </p>
          </div>
        </div>
      </section>

      {/* CONTENT FULL - CUADRO DE CONTENIDO DESDE CONTENTFUL */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ScholarshipPhase entryId={contentfulEntryId} />
      </section>

      {/* CTA - BUTTON */}
      <section className="bg-gradient-to-r from-brand-blue to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">¿Listo para aplicar?</h3>
          <p className="text-xl text-blue-100 mb-8">
            Accede al portal y revisa el estado de tu solicitud
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-4 bg-white text-brand-blue rounded-lg hover:bg-gray-100 font-bold text-lg transition-all flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
          >
            Ingresar al Portal
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-2">¿Preguntas?</h3>
            <p className="text-gray-400">
              Contacta con Bienestar Universitario
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* EMAIL */}
            <div className="text-center">
              <div className="inline-block p-3 bg-brand-blue/20 rounded-full mb-4">
                <Mail className="text-brand-blue" size={28} />
              </div>
              <h4 className="font-bold mb-2">Correo</h4>
              <a
                href="mailto:becas@uce.edu.ec"
                className="text-gray-400 hover:text-white transition-colors"
              >
                becas@uce.edu.ec
              </a>
            </div>

            {/* TELÉFONO */}
            <div className="text-center">
              <div className="inline-block p-3 bg-brand-blue/20 rounded-full mb-4">
                <Phone className="text-brand-blue" size={28} />
              </div>
              <h4 className="font-bold mb-2">Teléfono</h4>
              <a
                href="tel:+593223960936"
                className="text-gray-400 hover:text-white transition-colors"
              >
                +593 (2) 396-0936 ext. 2500
              </a>
            </div>

            {/* UBICACIÓN */}
            <div className="text-center">
              <div className="inline-block p-3 bg-brand-blue/20 rounded-full mb-4">
                <MapPin className="text-brand-blue" size={28} />
              </div>
              <h4 className="font-bold mb-2">Ubicación</h4>
              <p className="text-gray-400">
                Bienestar Universitario
                <br />
                Quito, Ecuador
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-400 text-center py-6 border-t border-gray-800">
        <p>&copy; 2026 Universidad Central del Ecuador - Programa de Becas</p>
      </footer>
    </div>
  );
};

export default Home;
