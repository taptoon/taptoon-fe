import {useState, useEffect} from 'react';
import {Box, Typography, Button, Fab, List, ListItem, ListItemText} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat'; // 채팅 아이콘
import AddIcon from '@mui/icons-material/Add'; // 포트폴리오 등록/작성 아이콘
import FolderIcon from '@mui/icons-material/Folder'; // 포트폴리오 목록 아이콘
import axios from 'axios'; // API 호출을 위한 axios 추가

// 넷플릭스 글씨체를 시뮬레이션하기 위해 Google Fonts에서 Bebas Neue 사용
import 'typeface-bebas-neue'; // Bebas Neue 폰트를 설치하거나, CSS로 임포트

function MyProfile() {
    const [user, setUser] = useState(null); // 사용자 데이터 상태
    const [portfolios, setPortfolios] = useState([]); // 포트폴리오 리스트 상태
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [error, setError] = useState(null); // 에러 상태
    const navigate = useNavigate();

    // 사용자 정보와 포트폴리오 리스트 API 호출
    useEffect(() => {
        const fetchUserAndPortfolios = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    navigate('/login');
                    return;
                }

                // 1. 사용자 정보 API 호출
                const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/members`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                // 401 에러 처리: accessToken 만료 시 로그인 페이지로 리다이렉션
                if (userResponse.status === 401) {
                    handleUnauthorized();
                    return;
                }

                if (!userResponse.data.success_or_fail) {
                    throw new Error(userResponse.data.message || '사용자 정보 로드 실패');
                }

                setUser({
                    id: userResponse.data.data.id, // 사용자 ID 추가 (포트폴리오 조회에 필요)
                    email: userResponse.data.data.email,
                    name: userResponse.data.data.name,
                    nickname: userResponse.data.data.nickname,
                    grade: userResponse.data.data.grade,
                    created_at: userResponse.data.data.created_at,
                    updated_at: userResponse.data.data.updated_at,
                });

                // 2. 포트폴리오 리스트 API 호출 (사용자 ID로 포트폴리오 조회)
                const memberId = userResponse.data.data.id;
                const portfoliosResponse = await axios.get(`${process.env.REACT_APP_API_URL}/portfolios?memberId=${encodeURIComponent(memberId)}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                // 401 에러 처리: accessToken 만료 시 로그인 페이지로 리다이렉션
                if (portfoliosResponse.status === 401) {
                    handleUnauthorized();
                    return;
                }

                if (portfoliosResponse.data.success_or_fail) {
                    setPortfolios(portfoliosResponse.data.data || []); // 포트폴리오 리스트 설정
                } else if (portfoliosResponse.status === 404) {
                    setPortfolios([]); // 포트폴리오가 없는 경우 빈 배열로 설정
                } else {
                    throw new Error(portfoliosResponse.data.message || '포트폴리오 로드 실패');
                }
            } catch (err) {
                setError(err.message);
                if (err.response?.status === 401) {
                    handleUnauthorized();
                    return; // 에러 후 리다이렉션 후 함수 종료
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndPortfolios();
    }, [navigate]);

    const handleUnauthorized = () => {
        ['userId', 'accessToken', 'refreshToken'].forEach(item => localStorage.removeItem(item));
        navigate('/login');
    };

    // 로그아웃 처리 함수
    const handleLogout = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                navigate('/login');
                return;
            }

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            // 401 에러 처리: accessToken 만료 시 로그인 페이지로 리다이렉션
            if (response.status === 401) {
                handleUnauthorized();
                return;
            }
        } catch (err) {
            console.error('로그아웃 요청 중 오류 발생:', err);
            if (err.response?.status === 401) {
                handleUnauthorized();
                return; // 에러 후 리다이렉션 후 함수 종료
            }
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            navigate('/');
        }
    };

    // 내 채팅방으로 이동
    const handleGoToChatRooms = () => {
        navigate('/chat-rooms');
    };

    // 포트폴리오 등록/작성 페이지로 이동 (BASIC 등급 제한 추가)
    const handleCreatePortfolio = () => {
        if (user.grade === 'BASIC' && portfolios.length >= 5) {
            alert('BASIC 등급이 등록할 수 있는 포트폴리오 개수를 초과하셨습니다!');
            return; // 페이지 이동 방지
        }
        navigate('/portfolios/create'); // 포트폴리오 작성 페이지로 이동
    };

    // 포트폴리오 상세 페이지로 이동
    const handleViewPortfolioDetails = (portfolio) => {
        navigate(`/portfolios/${portfolio.portfolio_id}`, {state: {portfolio}}); // 포트폴리오 데이터 상태로 전달, 경로 변경
    };

    // 본문 내용 자르기 (50자 이상이면 ... 추가)
    const truncateContent = (content, maxLength = 50) => {
        if (content.length > maxLength) {
            return content.slice(0, maxLength) + '...';
        }
        return content;
    };

    if (loading) return <div style={{textAlign: 'center', padding: '20px', color: '#1976d2'}}>로딩 중...</div>;
    if (error) return <div style={{color: 'red', textAlign: 'center'}}>오류: {error}</div>;
    if (!user) return <div>사용자 정보를 찾을 수 없습니다.</div>;

    return (
        <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto', position: 'relative'}}>
            <Typography variant="h4" gutterBottom>내 프로필</Typography>
            <Box sx={{mt: 2, p: 2, backgroundColor: '#fff', borderRadius: 2, boxShadow: 1}}>
                <Typography variant="h6">이름: {user.name}</Typography>
                <Typography>닉네임: {user.nickname}</Typography>
                <Typography>이메일: {user.email}</Typography>
                <Typography>사용자 정보: {user.grade}</Typography>
                <Typography>계정 가입일시: {new Date(user.created_at).toLocaleString()}</Typography>
                <Typography>마지막 수정일시: {new Date(user.updated_at).toLocaleString()}</Typography>
                <Box sx={{mt: 2, display: 'flex', gap: 2}}>
                    <Button variant="contained" color="primary" onClick={() => navigate('/')}>
                        홈으로 돌아가기
                    </Button>
                    <Button variant="contained" color="secondary" onClick={handleLogout}>
                        로그아웃
                    </Button>
                </Box>
            </Box>

            {/* 포트폴리오 리스트 섹션 */}
            <Box sx={{mt: 4, p: 2, backgroundColor: '#fff', borderRadius: 2, boxShadow: 1}}>
                <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                        fontFamily: 'Bebas Neue, Arial, sans-serif', // 넷플릭스 스타일 시뮬레이션 (Bebas Neue)
                        fontSize: '24px',
                        color: '#e50914', // 넷플릭스 레드 컬러
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <FolderIcon sx={{color: '#e50914'}}/> 나의 포트폴리오 목록
                </Typography>
                <List>
                    {portfolios.map((portfolio) => (
                        <ListItem
                            key={portfolio.portfolio_id}
                            onClick={() => handleViewPortfolioDetails(portfolio)} // 아이템 클릭 시 상세 페이지로 이동
                            sx={{
                                borderBottom: '1px solid #e0e0e0',
                                padding: 2,
                                cursor: 'pointer', // 클릭 가능함을 시각적으로 표시
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-end', // 하단 정렬 유지
                                minHeight: 120, // 아이템 크기 유지
                                '&:hover': {
                                    backgroundColor: '#f5f5f5', // 호버 시 약간의 배경색 변화
                                },
                            }}
                        >
                            <ListItemText
                                primary={`포트폴리오 제목: ${portfolio.title || '제목 없음'}`}
                                secondary={
                                    <>
                                        설명: {truncateContent(portfolio.content || '설명 없음')} |
                                        생성일: {new Date(portfolio.created_at).toLocaleString()}
                                    </>
                                }
                                sx={{maxWidth: '70%'}} // 본문 공간 제한
                            />
                            {/* 수정 및 삭제 버튼 제거 */}
                            <Box sx={{display: 'flex', gap: 0.5, alignSelf: 'flex-end'}}>
                                {/* 파일 타입이 이미지일 경우 원형(Circled) 이미지 배열 (오른쪽 상단) */}
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
                                                        width: 36, // 이미지 크기 조정
                                                        height: 36, // 이미지 크기 조정
                                                        borderRadius: '50%', // 원형으로 변경
                                                        objectFit: 'cover',
                                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                        marginLeft: index > 0 ? '-6px' : 0, // 1/6 정도 겹침 (36px / 6 ≈ 6px)
                                                        border: '2px solid #fff', // 겹침 시 경계선
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = 'https://picsum.photos/36/36?text=Error';
                                                    }}
                                                />
                                            ))}
                                    </Box>
                                )}
                            </Box>
                        </ListItem>
                    ))}
                    {/* 포트폴리오 리스트가 있더라도 항상 맨 하단에 포트폴리오 추가 버튼 표시 */}
                    <Box sx={{mt: 2, display: 'flex', justifyContent: 'center'}}>
                        <Fab
                            color="error" // 빨간색
                            aria-label="create-portfolio"
                            onClick={handleCreatePortfolio}
                            sx={{
                                backgroundColor: '#f44336',
                                '&:hover': {backgroundColor: '#d32f2f', transform: 'scale(1.1)'}, // 애니메이션 유지
                                borderRadius: '50%',
                                width: 56,
                                height: 56,
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                transition: 'transform 0.3s ease-in-out', // 부드러운 전환 유지
                            }}
                        >
                            <AddIcon sx={{color: '#fff', fontSize: 30}}/>
                        </Fab>
                    </Box>
                </List>
            </Box>

            {/* 오른쪽 하단 플로팅 채팅 버튼 */}
            <Fab
                color="primary"
                onClick={handleGoToChatRooms}
                sx={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    backgroundColor: '#1976d2',
                    '&:hover': {backgroundColor: '#1565c0'},
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    zIndex: 1000,
                    animation: 'pulse 2s infinite',
                }}
            >
                <ChatIcon sx={{fontSize: 30}}/>
            </Fab>

            {/* 애니메이션 스타일 (CSS로 추가) */}
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

export default MyProfile;