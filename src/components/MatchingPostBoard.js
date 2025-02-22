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
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastId, setLastId] = useState(null);
  const [lastViewCount, setLastViewCount] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [artistType, setArtistType] = useState('전체');
  const [workType, setWorkType] = useState('전체');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const observer = useRef(null);
  const navigate = useNavigate();

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
        if (result.successOrFail) {
          setAutocompleteOptions(result.data || []);
        }
      } catch (err) {
        console.error('자동 완성 오류:', err);
      }
    }, 500)
  , []);

  const fetchPosts = useCallback(async (cursorId = null, cursorViewCount = null) => {
    try {
      setLoading(true);
      let url = 'http://localhost:8080/matching-posts';
      const params = new URLSearchParams();

      if (keyword) params.append('keyword', keyword);
      if (artistType !== '전체') params.append('artistType', artistType === '글작가' ? 'WRITER' : 'ILLUSTRATOR');
      if (workType !== '전체') params.append('workType', workType.toUpperCase());
      if (cursorId && cursorViewCount) {
        params.append('lastId', cursorId);
        params.append('lastViewCount', cursorViewCount);
      }

      if (params.toString()) url += `?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('게시글을 불러오지 못했습니다.');
      const result = await response.json();
      if (!result.successOrFail) throw new Error(result.message || 'API 호출 실패');

      const newPosts = result.data.content;
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
      setLastId(result.data.lastId);
      setLastViewCount(result.data.lastViewCount);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [keyword, artistType, workType]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const lastPostRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && lastId && lastViewCount) {
        fetchPosts(lastId, lastViewCount);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, lastId, lastViewCount, fetchPosts]);

  const handleSearchToggle = () => setIsSearchOpen(!isSearchOpen);
  const handleAutocompleteChange = (event, value) => {
    setKeyword(value || '');
    setPosts([]);
    fetchPosts();
    setIsSearchOpen(false);
  };

  const handleArtistSelect = (event) => {
    setArtistType(event.target.value);
    setPosts([]);
    fetchPosts();
  };

  const handleWorkSelect = (event) => {
    setWorkType(event.target.value);
    setPosts([]);
    fetchPosts();
  };

  const handlePostClick = (id) => {
    navigate(`/matching-posts/${id}`);
  };

  if (error) return <div>오류: {error}</div>;

  return (
    <ThemeProvider theme={theme}>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <h2>Matching Posts</h2>
          <Box>
            <IconButton onClick={handleSearchToggle} sx={{ mr: 1, color: '#1976d2' }}>
              <SearchIcon />
            </IconButton>
            <FormControl sx={{ mr: 1, minWidth: 120 }}>
              <InputLabel id="artist-type-label">작가 타입</InputLabel>
              <Select labelId="artist-type-label" value={artistType} onChange={handleArtistSelect} label="작가 타입" variant="outlined" size="small">
                <MenuItem value="전체">전체</MenuItem>
                <MenuItem value="글작가">글작가</MenuItem>
                <MenuItem value="그림작가">그림작가</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ mr: 1, minWidth: 120 }}>
              <InputLabel id="work-type-label">업무 형태</InputLabel>
              <Select labelId="work-type-label" value={workType} onChange={handleWorkSelect} label="업무 형태" variant="outlined" size="small">
                <MenuItem value="전체">전체</MenuItem>
                <MenuItem value="온라인">온라인</MenuItem>
                <MenuItem value="오프라인">오프라인</MenuItem>
                <MenuItem value="하이브리드">하이브리드</MenuItem>
              </Select>
            </FormControl>
            <Button component={Link} to="/create" variant="contained" color="primary" sx={{ mr: 1 }}>
              <EditIcon sx={{ mr: 0.5 }} /> 포스트 등록
            </Button>
            <Button component={Link} to="/profile" variant="contained" color="secondary">
              <PersonIcon sx={{ mr: 0.5 }} /> 내 프로필
            </Button>
          </Box>
        </Box>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: '20px' }}
            >
              <Autocomplete
                freeSolo
                options={autocompleteOptions}
                inputValue={keyword}
                onInputChange={(event, newInputValue) => {
                  setKeyword(newInputValue);
                  fetchAutocomplete(newInputValue);
                }}
                onChange={handleAutocompleteChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="검색"
                    variant="outlined"
                    placeholder="검색어를 입력하세요"
                    onKeyPress={(e) => e.key === 'Enter' && handleAutocompleteChange(null, keyword)}
                  />
                )}
                renderOption={(props, option) => (
                  <MenuItem {...props} key={option}>
                    {option}
                  </MenuItem>
                )}
                sx={{ width: '100%' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <List>
          {posts.map((post, index) => {
            const isLastPost = posts.length === index + 1;
            const uniqueKey = `${post.id}-${index}`;
            return (
              <ListItem key={uniqueKey} ref={isLastPost ? lastPostRef : null} disablePadding onClick={() => handlePostClick(post.id)}>
                <Card sx={{ width: '100%', marginBottom: '20px', boxShadow: 3, borderRadius: 2, transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'pointer' }}>
                  <CardHeader
                    title={post.title}
                    subheader={`${post.artistType}, ${post.workType}`}
                    sx={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {post.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      조회수: {post.viewCount} | 작성일: {new Date(post.createdAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </ListItem>
            );
          })}
        </List>
        {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>}
      </div>
    </ThemeProvider>
  );
}

export default MatchingPostBoard;