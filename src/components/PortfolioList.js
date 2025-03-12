import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Fab } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import axios from 'axios';

// 넷플릭스 글씨체를 시뮬레이션하기 위해 Google Fonts에서 Bebas Neue 사용
import 'typeface-bebas-neue';

function PortfolioList() {
    const [portfolios, setPortfolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // URL 쿼리 파라미터에서 memberId 추출
    const searchParams = new URLSearchParams(location.search);
    const memberId = searchParams.get('authorId'); // DetailedMatchingPost에서 전달된 authorId

    // 포트폴리오 리스트 API 호출
    useEffect(() => {
        const fetchPortfolios = async () => {
            try {
                if (!memberId) {
                    throw new Error('작성자 ID가 제공되지 않았습니다.');
                }

                setLoading(true);
                const accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    navigate('/login');
                    return;
                }

                // 포트폴리오 리스트 API 호출
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/portfolios?memberId=${encodeURIComponent(memberId)}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status === 401) {
                    navigate('/login');
                    return;
                }

                if (response.data.success_or_fail) {
                    setPortfolios(response.data.data || []);
                } else if (response.status === 404) {
                    setPortfolios([]);
                } else {
                    throw new Error(response.data.message || '포트폴리오 로드 실패');
                }
            } catch (err) {
                setError(err.message);
                if (err.response?.status === 401) {
                    navigate('/login');
                    return;
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolios();
    }, [memberId, navigate]);

    // 포트폴리오 상세 페이지로 이동
    const handleViewPortfolioDetails = (portfolio) => {
        navigate(`/portfolios/${portfolio.portfolio_id}`, { state: { portfolio } });
    };

    // 본문 내용 자르기 (50자 이상이면 ... 추가)
    const truncateContent = (content, maxLength = 50) => {
        if (content.length > maxLength) {
            return content.slice(0, maxLength) + '...';
        }
        return content;
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>;
    if (error) return <div style={{ color: 'red', textAlign: 'center' }}>오류: {error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
            <Typography variant="h4" gutterBottom>포트폴리오 목록</Typography>

            {/* 포트폴리오 리스트 섹션 */}
            <Box sx={{ mt: 4, p: 2, backgroundColor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                        fontFamily: 'Bebas Neue, Arial, sans-serif', // 넷플릭스 스타일 시뮬레이션
                        fontSize: '24px',
                        color: '#e50914', // 넷플릭스 레드 컬러
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <FolderIcon sx={{ color: '#e50914' }} /> 작성자의 포트폴리오 목록
                </Typography>
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
                                    padding: 2,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-end',
                                    minHeight: 120,
                                    '&:hover': {
                                        backgroundColor: '#f5f5f5',
                                    },
                                }}
                            >
                                <ListItemText
                                    primary={`포트폴리오 제목: ${portfolio.title || '제목 없음'}`}
                                    secondary={
                                        <>
                                            설명: {truncateContent(portfolio.content || '설명 없음')} | 생성일: {new Date(portfolio.created_at).toLocaleString()}
                                        </>
                                    }
                                    sx={{ maxWidth: '70%' }}
                                />
                                {/* 파일 타입이 이미지일 경우 원형 이미지 배열 */}
                                {portfolio.file_list && portfolio.file_list.some(file => file.file_type === 'IMAGE') && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}>
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
                                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                        marginLeft: index > 0 ? '-6px' : 0,
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
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Fab
                    color="primary"
                    aria-label="back"
                    onClick={() => navigate(-1)}
                    sx={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        backgroundColor: '#1976d2',
                        '&:hover': { backgroundColor: '#1565c0', transform: 'scale(1.1)' },
                        borderRadius: '50%',
                        width: 60,
                        height: 60,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        zIndex: 1000,
                        animation: 'pulse 2s infinite',
                    }}
                >
                    <span role="img" aria-label="back">⬅️</span>
                </Fab>
            </Box>

            {/* 애니메이션 스타일 */}
            <style>
                {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
            </style>
        </div>
    );
}

export default PortfolioList;