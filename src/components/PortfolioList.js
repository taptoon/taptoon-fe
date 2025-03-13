import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Fab } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import 'typeface-bebas-neue';

// 상수 정의
const API_BASE_URL = process.env.REACT_APP_API_URL;
const MAX_CONTENT_LENGTH = 50;
const ERROR_MESSAGES = {
    NO_MEMBER_ID: '작성자 ID가 제공되지 않았습니다.',
    FETCH_FAILED: '포트폴리오 데이터를 불러오지 못했습니다.',
};

function PortfolioList() {
    const [portfolios, setPortfolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { search } = useLocation();

    // URL 쿼리 파라미터에서 추출
    const memberId = new URLSearchParams(search).get('authorId');
    const memberName = new URLSearchParams(search).get('authorName');

    // 포트폴리오 리스트 API 호출
    useEffect(() => {
        const fetchPortfolios = async () => {
            try {
                if (!memberId) throw new Error(ERROR_MESSAGES.NO_MEMBER_ID);

                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/portfolios?memberId=${encodeURIComponent(memberId)}`);

                if (response.status === 401) handleUnauthorized();
                if (!response.ok) throw new Error(ERROR_MESSAGES.FETCH_FAILED);

                const result = await response.json();

                if (result.success_or_fail) {
                    setPortfolios(result.data || []);
                } else {
                    setPortfolios([]);
                    setError(result.message || '포트폴리오 로드 실패');
                }
            } catch (err) {
                setError(err.message);
                if (err.response?.status === 401) handleUnauthorized();
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolios();
    }, [memberId]);

    // 인증 실패 처리
    const handleUnauthorized = () => {
        ['userId', 'accessToken', 'refreshToken'].forEach(item => localStorage.removeItem(item));
        navigate('/login');
    };

    // 포트폴리오 상세 페이지로 이동
    const handleViewPortfolioDetails = (portfolio) => {
        navigate(`/portfolios/${portfolio.portfolio_id}`, { state: { portfolio } });
    };

    // 본문 내용 자르기
    const truncateContent = (content) => content.length > MAX_CONTENT_LENGTH ? `${content.slice(0, MAX_CONTENT_LENGTH)}...` : content;

    if (loading) return <Box sx={{ textAlign: 'center', p: 2, color: '#1976d2' }}>로딩 중...</Box>;
    if (error) return <Box sx={{ color: 'red', textAlign: 'center' }}>오류: {error}</Box>;

    return (
        <Box sx={{ p: 2, maxWidth: 800, mx: 'auto', position: 'relative' }}>
            <Typography
                variant="h5"
                gutterBottom
                sx={{ fontFamily: 'Bebas Neue, Arial, sans-serif', fontSize: '24px', color: '#4fd751', display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <FolderIcon sx={{ color: '#44e15e' }} /> '{memberName}'님의 포트폴리오 목록
            </Typography>

            {/* 포트폴리오 리스트 섹션 */}
            <Box sx={{ mt: 4, p: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                <List>
                    {portfolios.length === 0 ? (
                        <Typography sx={{ textAlign: 'center', color: '#666', mt: 2 }}>
                            등록된 포트폴리오가 없습니다.
                        </Typography>
                    ) : (
                        portfolios.map((portfolio) => (
                            <ListItem
                                key={portfolio.portfolio_id}
                                onClick={() => handleViewPortfolioDetails(portfolio)}
                                sx={{
                                    borderBottom: '1px solid #e0e0e0',
                                    p: 2,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-end',
                                    minHeight: 120,
                                    '&:hover': { bgcolor: '#f5f5f5' },
                                }}
                            >
                                <ListItemText
                                    primary={`포트폴리오 제목: ${portfolio.title || '제목 없음'}`}
                                    secondary={`설명: ${truncateContent(portfolio.content || '설명 없음')} | 생성일: ${new Date(portfolio.created_at).toLocaleString()}`}
                                    sx={{ maxWidth: '70%' }}
                                />
                                {portfolio.file_list?.some(file => file.file_type === 'IMAGE') && (
                                    <Box sx={{ position: 'absolute', top: 8, right: 0, display: 'flex', alignItems: 'center' }}>
                                        {portfolio.file_list
                                            .filter(file => file.file_type === 'IMAGE')
                                            .map((file, index) => (
                                                <Box
                                                    key={index}
                                                    component="img"
                                                    src={file.file_url || 'https://picsum.photos/36/36?text=Image'}
                                                    alt={`포트폴리오 이미지 ${index + 1}`}
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                        ml: index > 0 ? -0.75 : 0,
                                                        border: '2px solid #fff',
                                                    }}
                                                    onError={(e) => { e.target.src = 'https://picsum.photos/36/36?text=Error'; }}
                                                />
                                            ))}
                                    </Box>
                                )}
                            </ListItem>
                        ))
                    )}
                </List>
            </Box>

            {/* 뒤로 가기 버튼 */}
            <Fab
                color="primary"
                aria-label="back"
                onClick={() => navigate(-1)}
                sx={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    bgcolor: '#bde8b7',
                    '&:hover': { bgcolor: '#1565c0', transform: 'scale(1.1)' },
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    animation: 'pulse 2s infinite',
                }}
            >
                <span role="img" aria-label="back" style={{ fontSize: '35px' }}>⬅</span>
            </Fab>

            <style>{`@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }`}</style>
        </Box>
    );
}

export default PortfolioList;