import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, Typography, List, ListItem, IconButton, Box, Select, FormControl, InputLabel, Button, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import './MatchingPostBoard.css';

// 기본 테마 설정
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
  components: {
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          minWidth: '120px',
          backgroundColor: '#fff',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          marginBottom: '20px',
          width: '100%',
        },
        paper: {
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
        },
      },
    },
  },
});

// Debounce 함수 (성능 최적화)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function MatchingPostBoard() {
  const [posts, setPosts] = useState([]); // 게시글 데이터를 저장하는 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태
  const [lastId, setLastId] = useState(null); // 커서 기반 마지막 ID
  const [lastViewCount, setLastViewCount] = useState(null); // 커서 기반 마지막 조회수
  const [inputValue, setInputValue] = useState(''); // 검색창 입력값
  const [keyword, setKeyword] = useState(''); // 실제 검색 키워드 (엔터 키로만 업데이트)
  const [autocompleteOptions, setAutocompleteOptions] = useState([]); // 자동 완성 옵션
  const [artistType, setArtistType] = useState('전체'); // 작가 타입 (한국어로 표시, 영어로 API 전송)
  const [workType, setWorkType] = useState('전체'); // 업무 형태 (한국어로 표시, 영어로 API 전송)
  const [isSearchOpen, setIsSearchOpen] = useState(false); // 검색 입력창 열림 / 닫힘
  const [isLastPage, setIsLastPage] = useState(false);
  const navigate = useNavigate(); // 페이지 이동을 위한 navigate
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken')); // 로그인 상태 관리 (LocalStorage 사용, 초기 설정만)

  // 자동 완성 데이터를 가져오는 함수 (Debounce로 성능 최적화)
  const fetchAutocomplete = useMemo(() =>
          debounce(async (searchTerm) => {
            if (!searchTerm || searchTerm.length < 2) {
              setAutocompleteOptions([]);
              return;
            }
            try {
              const response = await fetch('http://localhost:8080/matching-posts/autocomplete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ keyword: searchTerm }),
              });
              if (!response.ok) throw new Error('자동 완성 데이터를 불러오지 못했습니다.');
              const result = await response.json();
              if (result.success_or_fail) {
                setAutocompleteOptions(result.data || []);
              }
            } catch (err) {
              console.error('자동 완성 오류:', err);
            }
          }, 500)
      , []);

  // 게시글 데이터를 가져오는 함수 (커서 기반 페이징)
  const fetchPosts = useCallback(async (cursorId = null, cursorViewCount = null) => {
    try {
      console.log(`in fetchPosts, cursorId=${cursorId}, cursorViewCount=${cursorViewCount}`);
      setLoading(true);
      let url = 'http://localhost:8080/matching-posts';
      const params = new URLSearchParams();

      if (keyword) params.append('keyword', keyword);

      // artistType을 한국어에서 영어로 변환
      const artistTypeMapping = {
        '전체': null, // 쿼리 파라미터에 추가하지 않음
        '글작가': 'WRITER',
        '그림작가': 'ILLUSTRATOR'
      };
      const apiArtistType = artistTypeMapping[artistType];
      if (apiArtistType) params.append('artistType', apiArtistType);

      // workType을 한국어에서 영어로 변환
      const workTypeMapping = {
        '전체': null, // 쿼리 파라미터에 추가하지 않음
        '온라인': 'ONLINE',
        '오프라인': 'OFFLINE',
        '하이브리드': 'HYBRID'
      };
      const apiWorkType = workTypeMapping[workType];
      if (apiWorkType) params.append('workType', apiWorkType);

      if (cursorId != null && cursorViewCount != null) {
        params.append('lastId', cursorId);
        params.append('lastViewCount', cursorViewCount);
      }

      if (params.toString()) url += `?${params.toString()}`;
      console.log('Fetching posts with URL:', url); // 디버깅 로그

      const response = await fetch(url);
      if (!response.ok) throw new Error('게시글을 불러오지 못했습니다.');
      const result = await response.json();
      console.log('API Response:', result); // 디버깅 로그
      if (result.success_of_fail === false) throw new Error(result.message || 'API 호출 실패');

      const newPosts = result.data.content; // id가 항상 유효하므로 별도 처리 생략
      setPosts(prevPosts => [...prevPosts, ...newPosts]); // 기존 데이터에 새 데이터 추가
      // lastId와 lastViewCount를 API 응답에서 직접 설정
      setLastId(result.data.last_id); // lastId가 null일 경우 서버에서 유효한 값 제공
      setLastViewCount(result.data.last_view_count || 0); // lastViewCount가 null일 경우 0으로 기본 설정
      setIsLastPage(result.data.is_last_page || false); // isLastPage가 undefined일 경우 false로 기본 설정
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [keyword, artistType, workType]); // 의존성 배열의 값이 바뀌어야 새로운 함수 생성. 그렇기에 값이 변경되지 않은 채로 호출하면 캐싱된 함수 사용됨

  // 컴포넌트 마운트 시 초기 데이터 가져오기 (한 번만 호출)
  useEffect(() => {
    fetchPosts(); // 초기 데이터 로드
  }, [keyword, artistType, workType]); // keyword, artistType, workType 변화에 따라 호출


  // 로그인/프로필 버튼 클릭 핸들러
  const handleAuthClick = () => {
    if (isLoggedIn) {
      navigate('/profile'); // 로그인 상태면 프로필 페이지로 이동
    } else {
      navigate('/login'); // 로그인 상태가 아니면 로그인 페이지로 이동
    }
  };

  // 검색 토글 처리 (검색어가 있으면 닫기 제한)
  const handleSearchToggle = () => {
    if (inputValue.trim() !== '') {
      console.log('검색어가 있으므로 검색창을 닫을 수 없습니다.');
    } else {
      setIsSearchOpen(!isSearchOpen); // 검색어가 없으면 열기/닫기 토글
    }
  };

  // 자동 완성
  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue); // 입력값 업데이트
    fetchAutocomplete(newInputValue); // 자동 완성 데이터 가져오기
  };

  // 엔터 키로 검색 처리
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      setKeyword(inputValue || ''); // 엔터 키로 keyword 업데이트
      setPosts([]); // 게시글 데이터 초기화
      setLastId(null); // 마지막 ID 초기화
      setLastViewCount(null); // 마지막 조회수 초기화
      setIsLastPage(false); // 마지막 페이지 여부 초기화
    }
  };

  // 작가 타입 필터 변경 처리 (한국어로 저장, 영어로 API 전송)
  const handleArtistSelect = (event) => {
    const selectedKorean = event.target.value; // 한국어 값 (예: '글작가', '그림작가', '전체')
    console.log(`event.target.value=${selectedKorean}`);
    if (selectedKorean === artistType) return; // 동일한 값이면 호출 생략

    setArtistType(selectedKorean); // 상태는 한국어로 저장
    setPosts([]);
    setLastId(null);
    setLastViewCount(null);
    setIsLastPage(false);
  };

  // 업무 형태 필터 변경 처리 (한국어로 저장, 영어로 API 전송)
  const handleWorkSelect = (event) => {
    const selectedKorean = event.target.value; // 한국어 값 (예: '온라인', '오프라인', '하이브리드', '전체')
    if (selectedKorean === workType) return; // 동일한 값이면 호출 생략

    setWorkType(selectedKorean); // 상태는 한국어로 저장
    setPosts([]);
    setLastId(null);
    setLastViewCount(null);
    setIsLastPage(false);
  };

  // 게시글 클릭 시 상세 페이지로 이동
  const handlePostClick = (id) => {
    navigate(`/matching-posts/${id}`);
  };

  // "더 불러오기" 버튼 클릭 핸들러
  const handleLoadMore = () => {
    console.log(`lastId=${lastId}, lastViewCount=${lastViewCount}, isLastPage=${isLastPage}`);
    console.log(`lastId && lastViewCount && isLastPage=${lastId && lastViewCount && isLastPage}`);
    if (isLastPage === false) {
      console.log('Loading more with:', lastId, lastViewCount); // 디버깅 로그
      fetchPosts(lastId, lastViewCount);
    } else {
      console.log('Cannot load more - lastId:', lastId, 'lastViewCount:', lastViewCount, 'isLastPage:', isLastPage); // 디버깅 로그
    }
  };

  // 에러 발생 시 표시
  if (error) return <div style={{ color: 'red', textAlign: 'center' }}>오류: {error}. 페이지를 새로고침하거나 나중에 다시 시도해주세요.</div>;

  return (
      <ThemeProvider theme={theme}>
        <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
          <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
            <h2>Matching Posts</h2>
            <Box>
              <IconButton onClick={handleSearchToggle} sx={{mr: 1, color: '#1976d2'}}>
                <SearchIcon/>
              </IconButton>
              <FormControl sx={{mr: 1, minWidth: 120}}>
                <InputLabel id="artist-type-label">작가 타입</InputLabel>
                <Select labelId="artist-type-label" value={artistType} onChange={handleArtistSelect} label="작가 타입"
                        variant="outlined" size="small">
                  <MenuItem value="전체">전체</MenuItem>
                  <MenuItem value="글작가">글작가</MenuItem>
                  <MenuItem value="그림작가">그림작가</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{mr: 1, minWidth: 120}}>
                <InputLabel id="work-type-label">업무 형태</InputLabel>
                <Select labelId="work-type-label" value={workType} onChange={handleWorkSelect} label="업무 형태"
                        variant="outlined" size="small">
                  <MenuItem value="전체">전체</MenuItem>
                  <MenuItem value="온라인">온라인</MenuItem>
                  <MenuItem value="오프라인">오프라인</MenuItem>
                  <MenuItem value="하이브리드">하이브리드</MenuItem>
                </Select>
              </FormControl>
              <Button component={Link} to="/create" variant="contained" color="primary" sx={{mr: 1}}>
                <EditIcon sx={{mr: 0.5}}/> 포스트 등록
              </Button>
              {/*<Button component={Link} to="/profile" variant="contained" color="secondary">*/}
              {/*  <PersonIcon sx={{mr: 0.5}}/> 내 프로필*/}
              {/*</Button>*/}
              <Button
                  variant="contained"
                  color={isLoggedIn ? 'secondary' : 'primary'}
                  onClick={handleAuthClick}
                  sx={{ mr: 1 }}
              >
                {isLoggedIn ? <PersonIcon sx={{ mr: 0.5 }} /> : null}
                {isLoggedIn ? '내 프로필' : '로그인'}
              </Button>
            </Box>
          </Box>

          <AnimatePresence>
            {isSearchOpen && (
                <motion.div
                    initial={{opacity: 0, height: 0}}
                    animate={{opacity: 1, height: 'auto'}}
                    exit={{opacity: 0, height: 0}}
                    style={{marginBottom: '20px'}}
                >
                  <Autocomplete
                      freeSolo
                      options={autocompleteOptions}
                      inputValue={inputValue} // 입력값으로 관리
                      onInputChange={handleInputChange} // 입력값 변경 처리
                      onKeyPress={handleKeyPress} // 엔터 키로 검색 처리
                      renderInput={(params) => (
                          <TextField
                              {...params}
                              label="검색"
                              variant="outlined"
                              placeholder="검색어를 입력하세요"
                          />
                      )}
                      renderOption={(props, option) => (
                          <MenuItem {...props} key={option}>
                            {option}
                          </MenuItem>
                      )}
                      sx={{width: '100%'}}
                  />
                </motion.div>
            )}
          </AnimatePresence>

          <List>
            {posts.map((post, index) => {
              const uniqueKey = `${post.id}-${index}`;
              return (
                  <ListItem key={uniqueKey} disablePadding onClick={() => handlePostClick(post.id)}>
                    <Card sx={{
                      width: '100%',
                      marginBottom: '20px',
                      boxShadow: 3,
                      borderRadius: 2,
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      cursor: 'pointer'
                    }}>
                      <CardHeader
                          title={`${post.title}(id=${post.id})`}
                          subheader={`${post.artist_type}, ${post.work_type}`}
                          sx={{backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0'}}
                      />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {post.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          조회수: {post.view_count} | 작성일: {new Date(post.created_at).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </ListItem>
              );
            })}
          </List>
          {loading && <div style={{textAlign: 'center', padding: '20px', color: '#1976d2'}}>로딩 중...</div>}
          {/* "더 불러오기" 버튼 추가 */}
          {!loading && !isLastPage && (
              <Box sx={{textAlign: 'center', mt: 2}}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLoadMore}
                    disabled={loading || isLastPage}
                >
                  더 불러오기
                </Button>
              </Box>
          )}
          {isLastPage && posts.length > 0 && (
              <Typography sx={{textAlign: 'center', mt: 2, color: 'gray'}}>
                마지막 게시글입니다.
              </Typography>
          )}
        </div>
      </ThemeProvider>
  );
}

export default MatchingPostBoard;