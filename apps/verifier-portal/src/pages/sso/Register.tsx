const Register = () => {
    return (
        <section className="min-h-screen flex font-sans">
            {/* Kolom Kiri: Form Register (Dark Background) */}
            <div className="w-full md:w-1/2 flex items-center justify-center bg-[#151924] text-white p-6 sm:p-12 lg:p-24">
                <div className="w-full max-w-md">
                    <h1 className="text-3xl text-yellow-200 font-bold mb-8">Daftar Verifier</h1>

                    {/* Form Email/Password */}
                    <form className="space-y-6" action="#" autoComplete="off">
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-white">Email</label>
                            <input
                                type="email"
                                id="email"
                                autoComplete="off"
                                className="bg-[#212936] border border-[#374151] text-white rounded-lg block w-full p-3 focus:ring-cyan-500 focus:border-cyan-500 placeholder-[#6B7280]"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-white">Password</label>
                            <input
                                type="password"
                                id="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="bg-[#212936] border border-[#374151] text-white rounded-lg block w-full p-3 focus:ring-cyan-500 focus:border-cyan-500 placeholder-[#6B7280]"
                                required
                            />
                        </div>

                        <button type="submit" className="w-full text-white bg-teal-500 hover:bg-teal-600 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-lg px-5 py-3 text-center transition duration-150">
                            Daftar
                        </button>
                    </form>
                </div>
            </div>

            {/* Kolom Kanan: Gambar Background dengan Overlay Gradasi */}
            <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
                {/* Gambar Background */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url('/bg-login.svg')` }}
                />
                
                {/* Overlay Gradasi Warna */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#07998D]/90 via-[#07998D]/70 to-[#151924]/90" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
                
                {/* Konten Teks di atas gambar - RATA TENGAH */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center text-white w-full p-12 lg:p-24">
                    <div className="max-w-lg mx-auto">
                        <div className="flex justify-center mb-6">
                            <span className="text-2xl font-bold italic">Digital Credential Academic System</span>
                        </div>

                        <h2 className="text-5xl lg:text-6xl xl:text-7xl text-yellow-200 font-extrabold leading-tight mb-6">
                            Verifier Portal
                        </h2>

                        <p className="text-lg text-white/90 backdrop-blur-sm bg-black/10 p-4 rounded-lg mx-auto">
                            Memverifikasi keaslian dokumen digital (Ijazah) tanpa menghubungi Universitas penerbit secara langsung.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Register;