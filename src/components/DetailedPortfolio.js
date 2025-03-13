import {useState, useEffect} from 'react';
import {useParams, useLocation, useNavigate} from 'react-router-dom';
import {Box, Typography, Button, IconButton, ImageList, ImageListItem} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {jwtDecode} from 'jwt-decode';

function DetailedPortfolio() {
    const {portfolioId} = useParams(); // URL에서 portfolioId 추출
    const location = useLocation();
    const navigate = useNavigate();
    const [portfolio, setPortfolio] = useState(location.state?.portfolio); // 상태에서 포트폴리오 데이터 가져오기
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 현재 사용자의 ID를 가져오는 함수
    const getCurrentUserId = () => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return null;
        try {
            const decodedToken = jwtDecode(accessToken);
            return decodedToken.sub ? parseInt(decodedToken.sub, 10) : null;
        } catch (error) {
            console.error('JWT 디코딩 실패:', error);
            return null;
        }
    };

    // 포트폴리오 데이터 가져오기
    useEffect(() => {
        if (!portfolio) {
            const fetchPortfolio = async () => {
                try {
                    const accessToken = localStorage.getItem('accessToken');
                    if (!accessToken) {
                        setLoading(false); // 토큰이 없으면 로딩 종료
                        return;
                    }

                    const response = await fetch(`${process.env.REACT_APP_API_URL}/portfolios/${portfolioId}`);

                    if (!response.ok) {
                        if (response.status === 401) {
                            handleUnauthorized();
                            return;
                        }
                        throw new Error('포트폴리오 로드 실패');
                    }

                    const result = await response.json();

                    if (result.success_or_fail) {
                        setPortfolio(result.data);
                    } else {
                        throw new Error(result.message || '포트폴리오 로드 실패');
                    }
                } catch (err) {
                    setError('포트폴리오 로드 중 오류가 발생했습니다: ' + err.message);
                } finally {
                    setLoading(false);
                }
            };

            setLoading(true);
            fetchPortfolio();
        }
    }, [portfolioId, navigate, portfolio]);

    const handleEditPortfolio = () => {
        navigate(`/portfolios/${portfolio?.portfolio_id}/edit`);
    };

    const handleDeletePortfolio = async () => {
        if (window.confirm('삭제하시겠습니까?')) {
            try {
                const accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    navigate('/login');
                    return;
                }

                const response = await fetch(`${process.env.REACT_APP_API_URL}/portfolios/${portfolio?.portfolio_id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        handleUnauthorized();
                        return;
                    }
                    throw new Error('포트폴리오 삭제 실패');
                }

                const result = await response.json();
                if (result.success_or_fail || response.status === 204) {
                    navigate('/profile');
                } else {
                    throw new Error(result.message || '포트폴리오 삭제 실패');
                }
            } catch (err) {
                setError('포트폴리오 삭제 중 오류가 발생했습니다: ' + err.message);
            }
        }
    };

    const handleUnauthorized = () => {
        ['userId', 'accessToken', 'refreshToken'].forEach((item) => localStorage.removeItem(item));
        navigate('/login');
    };

    // 현재 사용자가 작성자인지 확인
    const isOwner = () => {
        const currentUserId = getCurrentUserId();
        return currentUserId && portfolio?.owner_id && currentUserId === portfolio.owner_id;
    };

    if (loading) return <div style={{textAlign: 'center', padding: '20px', color: '#1976d2'}}>로딩 중...</div>;
    if (error) return <div style={{color: 'red', textAlign: 'center'}}>오류: {error}</div>;
    if (!portfolio) return <div>포트폴리오 정보를 찾을 수 없습니다.</div>;

    return (
        <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
            <Typography variant="h4" gutterBottom>포트폴리오 상세</Typography>
            <Box sx={{mt: 2, p: 2, backgroundColor: '#fff', borderRadius: 2, boxShadow: 1}}>
                <Typography variant="h6">제목: {portfolio.title || '제목 없음'}</Typography>
                <Typography sx={{whiteSpace: 'pre-wrap'}}>설명: {portfolio.content || '설명 없음'}</Typography>
                <Typography>생성일: {new Date(portfolio.created_at).toLocaleString()}</Typography>
                {/* 파일 리스트 (이미지와 파일 표시) */}
                {portfolio.file_list && portfolio.file_list.length > 0 && (
                    <Box sx={{mt: 2}}>
                        {/* 이미지 표시 (수직 배열) */}
                        {portfolio.file_list.filter((file) => file.file_type === 'IMAGE').length > 0 && (
                            <ImageList sx={{width: '100%', mt: 2}} cols={1} rowHeight={300}>
                                {portfolio.file_list
                                    .filter((file) => file.file_type === 'IMAGE')
                                    .map((file, index) => (
                                        <ImageListItem key={index}>
                                            <img
                                                src={file.file_url || 'https://picsum.photos/300/300?text=Image'}
                                                alt={`이미지 ${index + 1}`}
                                                loading="lazy"
                                                style={{objectFit: 'contain', width: '100%', height: '100%'}}
                                                onError={(e) => {
                                                    e.target.src = 'https://picsum.photos/300/300?text=Error';
                                                }}
                                            />
                                        </ImageListItem>
                                    ))}
                            </ImageList>
                        )}
                        {/* 파일 URL 링크 표시 */}
                        {portfolio.file_list.filter((file) => file.file_type === 'FILE').length > 0 && (
                            <Box sx={{mt: 2}}>
                                {portfolio.file_list
                                    .filter((file) => file.file_type === 'FILE')
                                    .map((file, index) => (
                                        <Box key={index} sx={{mb: 1}}>
                                            <Typography variant="body2">
                                                <a
                                                    href={file.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{color: '#1976d2', textDecoration: 'underline'}}
                                                >
                                                    {file.file_name}
                                                </a>
                                            </Typography>
                                        </Box>
                                    ))}
                            </Box>
                        )}
                    </Box>
                )}
                {/* 수정 및 삭제 버튼 (작성자만 표시) */}
                {isOwner() && (
                    <Box sx={{mt: 2, display: 'flex', gap: 1}}>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<EditIcon/>}
                            onClick={handleEditPortfolio}
                        >
                            수정
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon/>}
                            onClick={handleDeletePortfolio}
                        >
                            삭제
                        </Button>
                    </Box>
                )}
                {error && (
                    <Typography variant="body1" color="error.main" sx={{mt: 2}}>
                        {error}
                    </Typography>
                )}
            </Box>
        </div>
    );
}

export default DetailedPortfolio;