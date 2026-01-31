'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                // Hiển thị lỗi chi tiết hơn
                const errorMessage = result.error;
                console.error('Login error:', errorMessage);
                
                // Check for database connection errors
                if (
                    errorMessage === 'database' ||
                    errorMessage.includes('database') ||
                    errorMessage.includes('DATABASE_URL') ||
                    errorMessage.includes('connect') ||
                    errorMessage.includes('connection')
                ) {
                    setError('Lỗi kết nối database. Vui lòng kiểm tra cấu hình server hoặc chạy: npx prisma migrate deploy && npx prisma generate');
                } else if (errorMessage.includes('NEXTAUTH_SECRET')) {
                    setError('Lỗi cấu hình authentication. Vui lòng liên hệ quản trị viên.');
                } else if (
                    errorMessage.includes('CredentialsSignin') ||
                    errorMessage.includes('Không tìm thấy') ||
                    errorMessage.includes('Mật khẩu không chính xác')
                ) {
                    setError('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
                } else {
                    setError(errorMessage || 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
                }
            } else if (result?.ok) {
                router.push('/');
                router.refresh();
            } else {
                console.error('Login failed - no error, no ok:', result);
                setError('Đăng nhập thất bại. Vui lòng thử lại.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err?.message || 'Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại sau.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-start bg-gradient-to-br from-white via-zf-bg-secondary to-zf-bg-tertiary p-4 overflow-visible">
            {/* 4D Timeline Background */}
            <div className="absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
                {/* Building Wireframe - Detailed Structural View: Basement + Podium + 2 Towers */}
                <div className="absolute top-1/2 right-[2%] -translate-y-1/2 building-container">
                    <svg 
                        width="800" 
                        height="800" 
                        viewBox="0 -100 800 800" 
                        className="building-wireframe"
                        style={{ opacity: 0.7 }}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* Basement - Hầm */}
                        <g className="building-foundation foundation">
                            {/* Basement slab */}
                            <rect x="200" y="550" width="400" height="80" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            <polygon points="600,550 660,525 660,605 600,630" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            <polygon points="200,550 260,525 660,525 600,550" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            
                            {/* Basement columns grid - More detailed */}
                            <g className="basement-columns">
                                {/* Front columns - 10 columns */}
                                <line x1="240" y1="550" x2="240" y2="630" stroke="#178AF3" strokeWidth="2" />
                                <line x1="280" y1="550" x2="280" y2="630" stroke="#178AF3" strokeWidth="2" />
                                <line x1="320" y1="550" x2="320" y2="630" stroke="#178AF3" strokeWidth="2" />
                                <line x1="360" y1="550" x2="360" y2="630" stroke="#178AF3" strokeWidth="2" />
                                <line x1="400" y1="550" x2="400" y2="630" stroke="#178AF3" strokeWidth="2" />
                                <line x1="440" y1="550" x2="440" y2="630" stroke="#178AF3" strokeWidth="2" />
                                <line x1="480" y1="550" x2="480" y2="630" stroke="#178AF3" strokeWidth="2" />
                                <line x1="520" y1="550" x2="520" y2="630" stroke="#178AF3" strokeWidth="2" />
                                <line x1="560" y1="550" x2="560" y2="630" stroke="#178AF3" strokeWidth="2" />
                                
                                {/* Back columns (isometric) - 11 columns */}
                                <line x1="260" y1="525" x2="260" y2="605" stroke="#178AF3" strokeWidth="2" />
                                <line x1="300" y1="525" x2="300" y2="605" stroke="#178AF3" strokeWidth="2" />
                                <line x1="340" y1="525" x2="340" y2="605" stroke="#178AF3" strokeWidth="2" />
                                <line x1="380" y1="525" x2="380" y2="605" stroke="#178AF3" strokeWidth="2" />
                                <line x1="420" y1="525" x2="420" y2="605" stroke="#178AF3" strokeWidth="2" />
                                <line x1="460" y1="525" x2="460" y2="605" stroke="#178AF3" strokeWidth="2" />
                                <line x1="500" y1="525" x2="500" y2="605" stroke="#178AF3" strokeWidth="2" />
                                <line x1="540" y1="525" x2="540" y2="605" stroke="#178AF3" strokeWidth="2" />
                                <line x1="580" y1="525" x2="580" y2="605" stroke="#178AF3" strokeWidth="2" />
                                <line x1="620" y1="525" x2="620" y2="605" stroke="#178AF3" strokeWidth="2" />
                                <line x1="640" y1="525" x2="640" y2="605" stroke="#178AF3" strokeWidth="2" />
                                
                                {/* Grid lines on basement slab */}
                                <line x1="200" y1="570" x2="600" y2="570" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="200" y1="590" x2="600" y2="590" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="200" y1="610" x2="600" y2="610" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="260" y1="545" x2="660" y2="545" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="260" y1="565" x2="660" y2="565" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="260" y1="585" x2="660" y2="585" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                        </g>
                        
                        {/* Podium - Tầng đế */}
                        <g className="building-podium building-level level-0 ground-level">
                            {/* Podium slab */}
                            <rect x="200" y="470" width="400" height="80" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            <polygon points="600,470 660,445 660,525 600,550" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            <polygon points="200,470 260,445 660,445 600,470" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            
                            {/* Podium columns - Grid pattern - More detailed */}
                            <g className="podium-columns">
                                {/* Front columns - 10 columns */}
                                <line x1="240" y1="470" x2="240" y2="550" stroke="#178AF3" strokeWidth="2" />
                                <line x1="280" y1="470" x2="280" y2="550" stroke="#178AF3" strokeWidth="2" />
                                <line x1="320" y1="470" x2="320" y2="550" stroke="#178AF3" strokeWidth="2" />
                                <line x1="360" y1="470" x2="360" y2="550" stroke="#178AF3" strokeWidth="2" />
                                <line x1="400" y1="470" x2="400" y2="550" stroke="#178AF3" strokeWidth="2" />
                                <line x1="440" y1="470" x2="440" y2="550" stroke="#178AF3" strokeWidth="2" />
                                <line x1="480" y1="470" x2="480" y2="550" stroke="#178AF3" strokeWidth="2" />
                                <line x1="520" y1="470" x2="520" y2="550" stroke="#178AF3" strokeWidth="2" />
                                <line x1="560" y1="470" x2="560" y2="550" stroke="#178AF3" strokeWidth="2" />
                                
                                {/* Back columns - 11 columns */}
                                <line x1="260" y1="445" x2="260" y2="525" stroke="#178AF3" strokeWidth="2" />
                                <line x1="300" y1="445" x2="300" y2="525" stroke="#178AF3" strokeWidth="2" />
                                <line x1="340" y1="445" x2="340" y2="525" stroke="#178AF3" strokeWidth="2" />
                                <line x1="380" y1="445" x2="380" y2="525" stroke="#178AF3" strokeWidth="2" />
                                <line x1="420" y1="445" x2="420" y2="525" stroke="#178AF3" strokeWidth="2" />
                                <line x1="460" y1="445" x2="460" y2="525" stroke="#178AF3" strokeWidth="2" />
                                <line x1="500" y1="445" x2="500" y2="525" stroke="#178AF3" strokeWidth="2" />
                                <line x1="540" y1="445" x2="540" y2="525" stroke="#178AF3" strokeWidth="2" />
                                <line x1="580" y1="445" x2="580" y2="525" stroke="#178AF3" strokeWidth="2" />
                                <line x1="620" y1="445" x2="620" y2="525" stroke="#178AF3" strokeWidth="2" />
                                <line x1="640" y1="445" x2="640" y2="525" stroke="#178AF3" strokeWidth="2" />
                                
                                {/* Grid lines on podium slab - More detailed */}
                                <line x1="200" y1="490" x2="600" y2="490" stroke="#178AF3" strokeWidth="1.2" opacity="0.6" />
                                <line x1="200" y1="510" x2="600" y2="510" stroke="#178AF3" strokeWidth="1.2" opacity="0.6" />
                                <line x1="200" y1="530" x2="600" y2="530" stroke="#178AF3" strokeWidth="1.2" opacity="0.6" />
                                <line x1="260" y1="465" x2="660" y2="465" stroke="#178AF3" strokeWidth="1.2" opacity="0.6" />
                                <line x1="260" y1="485" x2="660" y2="485" stroke="#178AF3" strokeWidth="1.2" opacity="0.6" />
                                <line x1="260" y1="505" x2="660" y2="505" stroke="#178AF3" strokeWidth="1.2" opacity="0.6" />
                            </g>
                        </g>
                        
                        {/* Tower 1 - Left Tower */}
                        <g className="building-tower tower-1">
                            {/* Tower base on podium */}
                            <rect x="240" y="410" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            <polygon points="380,410 420,395 420,455 380,470" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            <polygon points="240,410 280,395 420,395 380,410" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            
                            {/* Tower columns - More columns for detail */}
                            <g className="tower1-columns">
                                <line x1="270" y1="410" x2="270" y2="470" stroke="#178AF3" strokeWidth="2" />
                                <line x1="300" y1="410" x2="300" y2="470" stroke="#178AF3" strokeWidth="2" />
                                <line x1="330" y1="410" x2="330" y2="470" stroke="#178AF3" strokeWidth="2" />
                                <line x1="360" y1="410" x2="360" y2="470" stroke="#178AF3" strokeWidth="2" />
                                <line x1="280" y1="395" x2="280" y2="455" stroke="#178AF3" strokeWidth="2" />
                                <line x1="310" y1="395" x2="310" y2="455" stroke="#178AF3" strokeWidth="2" />
                                <line x1="340" y1="395" x2="340" y2="455" stroke="#178AF3" strokeWidth="2" />
                                <line x1="370" y1="395" x2="370" y2="455" stroke="#178AF3" strokeWidth="2" />
                                <line x1="400" y1="395" x2="400" y2="455" stroke="#178AF3" strokeWidth="2" />
                            </g>
                            
                            {/* Tower levels with slabs and columns - Level 1 */}
                            <g className="building-level level-1">
                                <rect x="240" y="350" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="380,350 420,290 420,350 380,410" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="240,350 280,290 420,290 380,350" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="270" y1="350" x2="270" y2="410" stroke="#178AF3" strokeWidth="2" />
                                <line x1="300" y1="350" x2="300" y2="410" stroke="#178AF3" strokeWidth="2" />
                                <line x1="330" y1="350" x2="330" y2="410" stroke="#178AF3" strokeWidth="2" />
                                <line x1="360" y1="350" x2="360" y2="410" stroke="#178AF3" strokeWidth="2" />
                                <line x1="280" y1="290" x2="280" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="310" y1="290" x2="310" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="340" y1="290" x2="340" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="370" y1="290" x2="370" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="400" y1="290" x2="400" y2="350" stroke="#178AF3" strokeWidth="2" />
                                {/* Grid lines on slab */}
                                <line x1="240" y1="370" x2="380" y2="370" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="240" y1="390" x2="380" y2="390" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="310" x2="420" y2="310" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="330" x2="420" y2="330" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 2 */}
                            <g className="building-level level-2">
                                <rect x="240" y="290" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="380,290 420,230 420,290 380,350" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="240,290 280,230 420,230 380,290" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="270" y1="290" x2="270" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="300" y1="290" x2="300" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="330" y1="290" x2="330" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="360" y1="290" x2="360" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="280" y1="230" x2="280" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="310" y1="230" x2="310" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="340" y1="230" x2="340" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="370" y1="230" x2="370" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="400" y1="230" x2="400" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="240" y1="310" x2="380" y2="310" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="240" y1="330" x2="380" y2="330" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="250" x2="420" y2="250" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="270" x2="420" y2="270" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 3 */}
                            <g className="building-level level-3">
                                <rect x="240" y="230" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="380,230 420,170 420,230 380,290" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="240,230 280,170 420,170 380,230" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="270" y1="230" x2="270" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="300" y1="230" x2="300" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="330" y1="230" x2="330" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="360" y1="230" x2="360" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="280" y1="170" x2="280" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="310" y1="170" x2="310" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="340" y1="170" x2="340" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="370" y1="170" x2="370" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="400" y1="170" x2="400" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="240" y1="250" x2="380" y2="250" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="240" y1="270" x2="380" y2="270" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="190" x2="420" y2="190" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="210" x2="420" y2="210" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 4 */}
                            <g className="building-level level-4">
                                <rect x="240" y="170" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="380,170 420,110 420,170 380,230" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="240,170 280,110 420,110 380,170" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="270" y1="170" x2="270" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="300" y1="170" x2="300" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="330" y1="170" x2="330" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="360" y1="170" x2="360" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="280" y1="110" x2="280" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="310" y1="110" x2="310" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="340" y1="110" x2="340" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="370" y1="110" x2="370" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="400" y1="110" x2="400" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="240" y1="190" x2="380" y2="190" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="240" y1="210" x2="380" y2="210" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="130" x2="420" y2="130" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="150" x2="420" y2="150" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 5 */}
                            <g className="building-level level-5">
                                <rect x="240" y="110" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="380,110 420,50 420,110 380,170" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="240,110 280,50 420,50 380,110" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="270" y1="110" x2="270" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="300" y1="110" x2="300" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="330" y1="110" x2="330" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="360" y1="110" x2="360" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="280" y1="50" x2="280" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="310" y1="50" x2="310" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="340" y1="50" x2="340" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="370" y1="50" x2="370" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="400" y1="50" x2="400" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="240" y1="130" x2="380" y2="130" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="240" y1="150" x2="380" y2="150" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="70" x2="420" y2="70" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="90" x2="420" y2="90" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 6 */}
                            <g className="building-level level-6">
                                <rect x="240" y="50" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="380,50 420,-10 420,50 380,110" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="240,50 280,-10 420,-10 380,50" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="270" y1="50" x2="270" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="300" y1="50" x2="300" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="330" y1="50" x2="330" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="360" y1="50" x2="360" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="280" y1="-10" x2="280" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="310" y1="-10" x2="310" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="340" y1="-10" x2="340" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="370" y1="-10" x2="370" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="400" y1="-10" x2="400" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="240" y1="70" x2="380" y2="70" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="240" y1="90" x2="380" y2="90" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="10" x2="420" y2="10" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="30" x2="420" y2="30" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 7 */}
                            <g className="building-level level-7">
                                <rect x="240" y="-10" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="380,-10 420,-70 420,-10 380,50" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="240,-10 280,-70 420,-70 380,-10" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="270" y1="-10" x2="270" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="300" y1="-10" x2="300" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="330" y1="-10" x2="330" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="360" y1="-10" x2="360" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="280" y1="-70" x2="280" y2="-10" stroke="#178AF3" strokeWidth="2" />
                                <line x1="310" y1="-70" x2="310" y2="-10" stroke="#178AF3" strokeWidth="2" />
                                <line x1="340" y1="-70" x2="340" y2="-10" stroke="#178AF3" strokeWidth="2" />
                                <line x1="370" y1="-70" x2="370" y2="-10" stroke="#178AF3" strokeWidth="2" />
                                <line x1="400" y1="-70" x2="400" y2="-10" stroke="#178AF3" strokeWidth="2" />
                                <line x1="240" y1="10" x2="380" y2="10" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="240" y1="30" x2="380" y2="30" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="-50" x2="420" y2="-50" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="280" y1="-30" x2="420" y2="-30" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                        </g>
                        
                        {/* Tower 2 - Right Tower */}
                        <g className="building-tower tower-2">
                            {/* Tower base on podium */}
                            <rect x="460" y="410" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            <polygon points="600,410 640,395 640,455 600,470" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            <polygon points="460,410 500,395 640,395 600,410" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                            
                            {/* Tower columns - More columns for detail */}
                            <g className="tower2-columns">
                                <line x1="490" y1="410" x2="490" y2="470" stroke="#178AF3" strokeWidth="2" />
                                <line x1="520" y1="410" x2="520" y2="470" stroke="#178AF3" strokeWidth="2" />
                                <line x1="550" y1="410" x2="550" y2="470" stroke="#178AF3" strokeWidth="2" />
                                <line x1="580" y1="410" x2="580" y2="470" stroke="#178AF3" strokeWidth="2" />
                                <line x1="500" y1="395" x2="500" y2="455" stroke="#178AF3" strokeWidth="2" />
                                <line x1="530" y1="395" x2="530" y2="455" stroke="#178AF3" strokeWidth="2" />
                                <line x1="560" y1="395" x2="560" y2="455" stroke="#178AF3" strokeWidth="2" />
                                <line x1="590" y1="395" x2="590" y2="455" stroke="#178AF3" strokeWidth="2" />
                                <line x1="620" y1="395" x2="620" y2="455" stroke="#178AF3" strokeWidth="2" />
                            </g>
                            
                            {/* Tower levels with slabs and columns - Level 1 */}
                            <g className="building-level level-1">
                                <rect x="460" y="350" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="600,350 640,290 640,350 600,410" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="460,350 500,290 640,290 600,350" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="490" y1="350" x2="490" y2="410" stroke="#178AF3" strokeWidth="2" />
                                <line x1="520" y1="350" x2="520" y2="410" stroke="#178AF3" strokeWidth="2" />
                                <line x1="550" y1="350" x2="550" y2="410" stroke="#178AF3" strokeWidth="2" />
                                <line x1="580" y1="350" x2="580" y2="410" stroke="#178AF3" strokeWidth="2" />
                                <line x1="500" y1="290" x2="500" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="530" y1="290" x2="530" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="560" y1="290" x2="560" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="590" y1="290" x2="590" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="620" y1="290" x2="620" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="460" y1="370" x2="600" y2="370" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="460" y1="390" x2="600" y2="390" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="310" x2="640" y2="310" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="330" x2="640" y2="330" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 2 */}
                            <g className="building-level level-2">
                                <rect x="460" y="290" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="600,290 640,230 640,290 600,350" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="460,290 500,230 640,230 600,290" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="490" y1="290" x2="490" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="520" y1="290" x2="520" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="550" y1="290" x2="550" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="580" y1="290" x2="580" y2="350" stroke="#178AF3" strokeWidth="2" />
                                <line x1="500" y1="230" x2="500" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="530" y1="230" x2="530" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="560" y1="230" x2="560" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="590" y1="230" x2="590" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="620" y1="230" x2="620" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="460" y1="310" x2="600" y2="310" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="460" y1="330" x2="600" y2="330" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="250" x2="640" y2="250" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="270" x2="640" y2="270" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 3 */}
                            <g className="building-level level-3">
                                <rect x="460" y="230" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="600,230 640,170 640,230 600,290" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="460,230 500,170 640,170 600,230" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="490" y1="230" x2="490" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="520" y1="230" x2="520" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="550" y1="230" x2="550" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="580" y1="230" x2="580" y2="290" stroke="#178AF3" strokeWidth="2" />
                                <line x1="500" y1="170" x2="500" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="530" y1="170" x2="530" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="560" y1="170" x2="560" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="590" y1="170" x2="590" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="620" y1="170" x2="620" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="460" y1="250" x2="600" y2="250" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="460" y1="270" x2="600" y2="270" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="190" x2="640" y2="190" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="210" x2="640" y2="210" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 4 */}
                            <g className="building-level level-4">
                                <rect x="460" y="170" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="600,170 640,110 640,170 600,230" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="460,170 500,110 640,110 600,170" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="490" y1="170" x2="490" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="520" y1="170" x2="520" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="550" y1="170" x2="550" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="580" y1="170" x2="580" y2="230" stroke="#178AF3" strokeWidth="2" />
                                <line x1="500" y1="110" x2="500" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="530" y1="110" x2="530" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="560" y1="110" x2="560" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="590" y1="110" x2="590" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="620" y1="110" x2="620" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="460" y1="190" x2="600" y2="190" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="460" y1="210" x2="600" y2="210" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="130" x2="640" y2="130" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="150" x2="640" y2="150" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 5 */}
                            <g className="building-level level-5">
                                <rect x="460" y="110" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="600,110 640,50 640,110 600,170" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="460,110 500,50 640,50 600,110" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="490" y1="110" x2="490" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="520" y1="110" x2="520" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="550" y1="110" x2="550" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="580" y1="110" x2="580" y2="170" stroke="#178AF3" strokeWidth="2" />
                                <line x1="500" y1="50" x2="500" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="530" y1="50" x2="530" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="560" y1="50" x2="560" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="590" y1="50" x2="590" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="620" y1="50" x2="620" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="460" y1="130" x2="600" y2="130" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="460" y1="150" x2="600" y2="150" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="70" x2="640" y2="70" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="90" x2="640" y2="90" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 6 */}
                            <g className="building-level level-6">
                                <rect x="460" y="50" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="600,50 640,-10 640,50 600,110" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="460,50 500,-10 640,-10 600,50" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="490" y1="50" x2="490" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="520" y1="50" x2="520" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="550" y1="50" x2="550" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="580" y1="50" x2="580" y2="110" stroke="#178AF3" strokeWidth="2" />
                                <line x1="500" y1="-10" x2="500" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="530" y1="-10" x2="530" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="560" y1="-10" x2="560" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="590" y1="-10" x2="590" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="620" y1="-10" x2="620" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="460" y1="70" x2="600" y2="70" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="460" y1="90" x2="600" y2="90" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="10" x2="640" y2="10" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="30" x2="640" y2="30" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                            
                            {/* Level 7 */}
                            <g className="building-level level-7">
                                <rect x="460" y="-10" width="140" height="60" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="600,-10 640,-70 640,-10 600,50" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <polygon points="460,-10 500,-70 640,-70 600,-10" fill="none" stroke="#178AF3" strokeWidth="2.5" />
                                <line x1="490" y1="-10" x2="490" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="520" y1="-10" x2="520" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="550" y1="-10" x2="550" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="580" y1="-10" x2="580" y2="50" stroke="#178AF3" strokeWidth="2" />
                                <line x1="500" y1="-70" x2="500" y2="-10" stroke="#178AF3" strokeWidth="2" />
                                <line x1="530" y1="-70" x2="530" y2="-10" stroke="#178AF3" strokeWidth="2" />
                                <line x1="560" y1="-70" x2="560" y2="-10" stroke="#178AF3" strokeWidth="2" />
                                <line x1="590" y1="-70" x2="590" y2="-10" stroke="#178AF3" strokeWidth="2" />
                                <line x1="620" y1="-70" x2="620" y2="-10" stroke="#178AF3" strokeWidth="2" />
                                <line x1="460" y1="10" x2="600" y2="10" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="460" y1="30" x2="600" y2="30" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="-50" x2="640" y2="-50" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                                <line x1="500" y1="-30" x2="640" y2="-30" stroke="#178AF3" strokeWidth="1" opacity="0.5" />
                            </g>
                        </g>
                    </svg>
            </div>

                {/* Timeline Bar - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-white/40 backdrop-blur-sm border-t border-zf-graphite/10">
                    {/* Timeline Track */}
                    <div className="relative h-full w-full">
                        {/* Timeline Milestones */}
                        <div className="absolute inset-0 flex items-center justify-between px-4 md:px-8">
                            <div className="timeline-milestone flex flex-col items-center gap-0.5" data-level="foundation">
                                <div className="w-2.5 h-2.5 rounded-full bg-zf-accent/60"></div>
                                <span className="text-[10px] font-medium text-zf-text-secondary">Móng</span>
                            </div>
                            <div className="timeline-milestone flex flex-col items-center gap-0.5" data-level="0">
                                <div className="w-2.5 h-2.5 rounded-full bg-zf-accent/60"></div>
                                <span className="text-[10px] font-medium text-zf-text-secondary">Tầng 0</span>
                            </div>
                            <div className="timeline-milestone flex flex-col items-center gap-0.5" data-level="1">
                                <div className="w-2.5 h-2.5 rounded-full bg-zf-accent/60"></div>
                                <span className="text-[10px] font-medium text-zf-text-secondary">L1</span>
                            </div>
                            <div className="timeline-milestone flex flex-col items-center gap-0.5" data-level="2">
                                <div className="w-2.5 h-2.5 rounded-full bg-zf-accent/60"></div>
                                <span className="text-[10px] font-medium text-zf-text-secondary">L2</span>
                            </div>
                            <div className="timeline-milestone flex flex-col items-center gap-0.5" data-level="3">
                                <div className="w-2.5 h-2.5 rounded-full bg-zf-accent/60"></div>
                                <span className="text-[10px] font-medium text-zf-text-secondary">L3</span>
                            </div>
                            <div className="timeline-milestone flex flex-col items-center gap-0.5" data-level="4">
                                <div className="w-2.5 h-2.5 rounded-full bg-zf-accent/60"></div>
                                <span className="text-[10px] font-medium text-zf-text-secondary">L4</span>
                            </div>
                            <div className="timeline-milestone flex flex-col items-center gap-0.5" data-level="5">
                                <div className="w-2.5 h-2.5 rounded-full bg-zf-accent/60"></div>
                                <span className="text-[10px] font-medium text-zf-text-secondary">L5</span>
                            </div>
                            <div className="timeline-milestone flex flex-col items-center gap-0.5" data-level="6">
                                <div className="w-2.5 h-2.5 rounded-full bg-zf-accent/60"></div>
                                <span className="text-[10px] font-medium text-zf-text-secondary">L6</span>
                            </div>
                            <div className="timeline-milestone flex flex-col items-center gap-0.5" data-level="7">
                                <div className="w-2.5 h-2.5 rounded-full bg-zf-accent/60"></div>
                                <span className="text-[10px] font-medium text-zf-text-secondary">L7</span>
                        </div>
                    </div>
                        
                        {/* Timeline Progress Line */}
                        <div className="absolute bottom-4 left-0 h-1 bg-zf-accent/40 timeline-track"></div>
                        
                        {/* Timeline Cursor */}
                        <div className="absolute bottom-4 left-0 h-1 w-1 timeline-cursor">
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-zf-accent shadow-lg shadow-zf-accent/50"></div>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-zf-accent"></div>
                        </div>
                    </div>
                </div>

                {/* Overlay - Light with Vignette */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-white/20 to-white/40 pointer-events-none"></div>
                    </div>

            <div className="relative z-20 w-full max-w-md mx-auto sm:ml-8 sm:mr-auto md:ml-12 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                {/* Header Decor */}
                <div className="bg-gradient-to-r from-zf-primary to-zf-primary-dark p-6 sm:p-8 text-zf-text-inverse text-center">
                    <div className="relative w-full h-16 sm:h-24 mb-3 sm:mb-4 flex items-center justify-center">
                        <div className="relative">
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight uppercase text-white select-none zfenix-logo">
                                <span className="inline-block bg-gradient-to-r from-white via-zf-accent/90 to-white bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(23,138,243,0.4)]">
                                    ZFENIX
                                </span>
                            </h1>
                            <div className="absolute -inset-2 bg-gradient-to-r from-zf-accent/30 via-transparent to-zf-accent/30 blur-2xl opacity-60 animate-pulse"></div>
                            </div>
                    </div>
                    <p className="text-zf-text-inverse/80 text-xs sm:text-sm opacity-80 uppercase tracking-widest font-medium">QUẢN LÝ DỰ ÁN</p>
                </div>

                <div className="p-4 sm:p-6 md:p-8">
                    <h2 className="text-xl sm:text-2xl font-semibold text-zf-text-primary mb-4 sm:mb-6 text-center">Đăng nhập</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-zf-error/10 border border-zf-error/30 text-zf-error rounded-lg text-sm font-medium animate-shake">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-zf-text-primary mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-zf-graphite/20 rounded-xl outline-none focus:ring-2 focus:ring-zf-accent focus:border-zf-accent transition-all"
                                    placeholder="admin@bimcompany.vn"
                                />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-zf-text-primary mb-1">Mật khẩu</label>
                                <input
                                type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-zf-graphite/20 rounded-xl outline-none focus:ring-2 focus:ring-zf-accent focus:border-zf-accent transition-all"
                                    placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 text-zf-accent rounded border-zf-graphite/30 focus:ring-zf-accent" />
                                <span className="text-sm text-zf-text-secondary group-hover:text-zf-text-primary transition-colors">Ghi nhớ đăng nhập</span>
                            </label>
                            <button disabled type="button" className="text-sm text-zf-accent hover:text-zf-accent-dark font-medium">
                                Quên mật khẩu?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`
                w-full py-4 bg-zf-accent text-zf-text-inverse rounded-xl font-bold text-lg transition-all shadow-lg shadow-zf-accent/30
                ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-zf-accent-dark hover:-translate-y-1 active:scale-95'}
                            `}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Đang đăng nhập...
                                </span>
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-zf-graphite/10 text-center">
                        <p className="text-sm text-zf-text-secondary italic">
                                "Trustworthy Pinnacle"
                        </p>
                    </div>
                    </div>
                </div>

            <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out 0s 2;
        }
        
        /* ZFENIX Logo Styling - Đậm, mềm mại, công nghệ */
        .zfenix-logo {
          font-weight: 700;
          letter-spacing: 0.05em;
          text-shadow: 0 0 20px rgba(23, 138, 243, 0.3),
                       0 0 40px rgba(23, 138, 243, 0.2),
                       0 2px 4px rgba(0, 0, 0, 0.1);
          filter: drop-shadow(0 2px 8px rgba(23, 138, 243, 0.25));
        }
        
        .zfenix-logo span {
          background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 30%, #178AF3 50%, #e0f2fe 70%, #ffffff 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-shift 3s ease-in-out infinite;
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        /* 4D Timeline Animations - 9 milestones (Foundation + Ground + 7 levels) */
        @keyframes timeline-cursor {
          0% { left: 0%; }
          10% { left: 11.1%; }   /* Foundation */
          21% { left: 22.2%; }   /* Ground Level */
          32% { left: 33.3%; }   /* Level 1 */
          43% { left: 44.4%; }   /* Level 2 */
          54% { left: 55.5%; }   /* Level 3 */
          65% { left: 66.6%; }   /* Level 4 */
          76% { left: 77.7%; }   /* Level 5 */
          87% { left: 88.8%; }   /* Level 6 */
          98% { left: 100%; }    /* Level 7 */
          100% { left: 100%; }
        }
        
        @keyframes timeline-track {
          0% { width: 0%; }
          10% { width: 11.1%; }
          21% { width: 22.2%; }
          32% { width: 33.3%; }
          43% { width: 44.4%; }
          54% { width: 55.5%; }
          65% { width: 66.6%; }
          76% { width: 77.7%; }
          87% { width: 88.8%; }
          98% { width: 100%; }
          100% { width: 100%; }
        }
        
        .timeline-cursor {
          animation: timeline-cursor 16s ease-in-out infinite;
        }
        
        .timeline-track {
          animation: timeline-track 16s ease-in-out infinite;
        }
        
        /* Building Level Reveal Animations */
        .building-level, .building-foundation {
                        opacity: 0;
        }
        
        @keyframes foundation-reveal {
          0%, 9% { opacity: 0; }
          10%, 100% { opacity: 1; }
        }
        
        @keyframes level-reveal-0 {
          0%, 20% { opacity: 0; }
          21%, 100% { opacity: 1; }
        }
        
        @keyframes level-reveal-1 {
          0%, 31% { opacity: 0; }
          32%, 100% { opacity: 1; }
        }
        
        @keyframes level-reveal-2 {
          0%, 42% { opacity: 0; }
          43%, 100% { opacity: 1; }
        }
        
        @keyframes level-reveal-3 {
          0%, 53% { opacity: 0; }
          54%, 100% { opacity: 1; }
        }
        
        @keyframes level-reveal-4 {
          0%, 64% { opacity: 0; }
          65%, 100% { opacity: 1; }
        }
        
        @keyframes level-reveal-5 {
          0%, 75% { opacity: 0; }
          76%, 100% { opacity: 1; }
        }
        
        @keyframes level-reveal-6 {
          0%, 86% { opacity: 0; }
          87%, 100% { opacity: 1; }
        }
        
        @keyframes level-reveal-7 {
          0%, 97% { opacity: 0; }
          98%, 100% { opacity: 1; }
        }
        
        .foundation {
          animation: foundation-reveal 16s ease-in-out infinite;
        }
        
        .ground-level {
          animation: level-reveal-0 16s ease-in-out infinite;
        }
        
        .level-1 {
          animation: level-reveal-1 16s ease-in-out infinite;
        }
        
        .level-2 {
          animation: level-reveal-2 16s ease-in-out infinite;
        }
        
        .level-3 {
          animation: level-reveal-3 16s ease-in-out infinite;
        }
        
        .level-4 {
          animation: level-reveal-4 16s ease-in-out infinite;
        }
        
        .level-5 {
          animation: level-reveal-5 16s ease-in-out infinite;
        }
        
        .level-6 {
          animation: level-reveal-6 16s ease-in-out infinite;
        }
        
        .level-7 {
          animation: level-reveal-7 16s ease-in-out infinite;
        }
        
        /* Level Highlight Glow */
        @keyframes foundation-glow {
          0%, 10%, 12%, 100% { 
            filter: drop-shadow(0 0 0px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 0.6;
          }
          11% { 
            filter: drop-shadow(0 0 8px #178AF3) drop-shadow(0 0 16px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 1;
          }
        }
        
        @keyframes level-glow-0 {
          0%, 21%, 23%, 100% { 
            filter: drop-shadow(0 0 0px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 0.6;
          }
          22% { 
            filter: drop-shadow(0 0 8px #178AF3) drop-shadow(0 0 16px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 1;
          }
        }
        
        @keyframes level-glow-1 {
          0%, 32%, 34%, 100% { 
            filter: drop-shadow(0 0 0px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 0.6;
          }
          33% { 
            filter: drop-shadow(0 0 8px #178AF3) drop-shadow(0 0 16px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 1;
          }
        }
        
        @keyframes level-glow-2 {
          0%, 43%, 45%, 100% { 
            filter: drop-shadow(0 0 0px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 0.6;
          }
          44% { 
            filter: drop-shadow(0 0 8px #178AF3) drop-shadow(0 0 16px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 1;
          }
        }
        
        @keyframes level-glow-3 {
          0%, 54%, 56%, 100% { 
            filter: drop-shadow(0 0 0px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 0.6;
          }
          55% { 
            filter: drop-shadow(0 0 8px #178AF3) drop-shadow(0 0 16px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 1;
          }
        }
        
        @keyframes level-glow-4 {
          0%, 65%, 67%, 100% { 
            filter: drop-shadow(0 0 0px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 0.6;
          }
          66% { 
            filter: drop-shadow(0 0 8px #178AF3) drop-shadow(0 0 16px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 1;
          }
        }
        
        @keyframes level-glow-5 {
          0%, 76%, 78%, 100% { 
            filter: drop-shadow(0 0 0px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 0.6;
          }
          77% { 
            filter: drop-shadow(0 0 8px #178AF3) drop-shadow(0 0 16px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 1;
          }
        }
        
        @keyframes level-glow-6 {
          0%, 87%, 89%, 100% { 
            filter: drop-shadow(0 0 0px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 0.6;
          }
          88% { 
            filter: drop-shadow(0 0 8px #178AF3) drop-shadow(0 0 16px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 1;
          }
        }
        
        @keyframes level-glow-7 {
          0%, 98%, 100% { 
            filter: drop-shadow(0 0 0px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 0.6;
          }
          100% { 
            filter: drop-shadow(0 0 8px #178AF3) drop-shadow(0 0 16px #178AF3);
            stroke: #178AF3;
            stroke-opacity: 1;
          }
        }
        
        .foundation > * {
          animation: foundation-glow 16s ease-in-out infinite;
        }
        
        .ground-level > * {
          animation: level-glow-0 16s ease-in-out infinite;
        }
        
        .level-1 > * {
          animation: level-glow-1 16s ease-in-out infinite;
        }
        
        .level-2 > * {
          animation: level-glow-2 16s ease-in-out infinite;
        }
        
        .level-3 > * {
          animation: level-glow-3 16s ease-in-out infinite;
        }
        
        .level-4 > * {
          animation: level-glow-4 16s ease-in-out infinite;
        }
        
        .level-5 > * {
          animation: level-glow-5 16s ease-in-out infinite;
        }
        
        .level-6 > * {
          animation: level-glow-6 16s ease-in-out infinite;
        }
        
        .level-7 > * {
          animation: level-glow-7 16s ease-in-out infinite;
        }
        
        /* Timeline Milestone Active - 9 milestones */
        @keyframes milestone-foundation {
          0%, 9%, 11%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          10% { 
            transform: scale(1.5);
                        opacity: 1;
            box-shadow: 0 0 12px #178AF3;
          }
        }
        
        @keyframes milestone-active-0 {
          0%, 20%, 22%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          21% { 
            transform: scale(1.5);
            opacity: 1;
            box-shadow: 0 0 12px #178AF3;
          }
        }
        
        @keyframes milestone-active-1 {
          0%, 31%, 33%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          32% { 
            transform: scale(1.5);
            opacity: 1;
            box-shadow: 0 0 12px #178AF3;
          }
        }
        
        @keyframes milestone-active-2 {
          0%, 42%, 44%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          43% { 
            transform: scale(1.5);
            opacity: 1;
            box-shadow: 0 0 12px #178AF3;
          }
        }
        
        @keyframes milestone-active-3 {
          0%, 53%, 55%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          54% { 
            transform: scale(1.5);
            opacity: 1;
            box-shadow: 0 0 12px #178AF3;
          }
        }
        
        @keyframes milestone-active-4 {
          0%, 64%, 66%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          65% { 
            transform: scale(1.5);
            opacity: 1;
            box-shadow: 0 0 12px #178AF3;
          }
        }
        
        @keyframes milestone-active-5 {
          0%, 75%, 77%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          76% { 
            transform: scale(1.5);
            opacity: 1;
            box-shadow: 0 0 12px #178AF3;
          }
        }
        
        @keyframes milestone-active-6 {
          0%, 86%, 88%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          87% { 
            transform: scale(1.5);
            opacity: 1;
            box-shadow: 0 0 12px #178AF3;
          }
        }
        
        @keyframes milestone-active-7 {
          0%, 97%, 99%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          98% { 
            transform: scale(1.5);
                        opacity: 1;
            box-shadow: 0 0 12px #178AF3;
          }
        }
        
        .timeline-milestone[data-level="foundation"] > div:first-child {
          animation: milestone-foundation 16s ease-in-out infinite;
        }
        
        .timeline-milestone[data-level="0"] > div:first-child {
          animation: milestone-active-0 16s ease-in-out infinite;
        }
        
        .timeline-milestone[data-level="1"] > div:first-child {
          animation: milestone-active-1 16s ease-in-out infinite;
        }
        
        .timeline-milestone[data-level="2"] > div:first-child {
          animation: milestone-active-2 16s ease-in-out infinite;
        }
        
        .timeline-milestone[data-level="3"] > div:first-child {
          animation: milestone-active-3 16s ease-in-out infinite;
        }
        
        .timeline-milestone[data-level="4"] > div:first-child {
          animation: milestone-active-4 16s ease-in-out infinite;
        }
        
        .timeline-milestone[data-level="5"] > div:first-child {
          animation: milestone-active-5 16s ease-in-out infinite;
        }
        
        .timeline-milestone[data-level="6"] > div:first-child {
          animation: milestone-active-6 16s ease-in-out infinite;
        }
        
        .timeline-milestone[data-level="7"] > div:first-child {
          animation: milestone-active-7 16s ease-in-out infinite;
        }
        
        /* Building Fade Out at End */
        @keyframes building-fade {
          0%, 95% { opacity: 0.4; }
          100% { opacity: 0.25; }
        }
        
        .building-wireframe {
          animation: building-fade 16s ease-in-out infinite;
        }
        
        /* Vignette Effect - Light */
        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, transparent 0%, rgba(255, 255, 255, 0.2) 50%, rgba(241, 245, 249, 0.4) 100%);
                }
            `}</style>
        </div>
    );
}
