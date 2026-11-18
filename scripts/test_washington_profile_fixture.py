"""Static regression guard for Washington direct-profile synthetic fixture exclusion.

Run: python -m unittest scripts/test_washington_profile_fixture.py
This is a source-level guard; browser and live data acceptance remain separate.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PROFILE = ROOT / 'app' / 'washington' / '[license]' / 'page.tsx'
FIXTURE_ID = '00000000-0000-4000-8000-0000000000e2'


class WashingtonProfileFixtureTest(unittest.TestCase):
    def test_direct_profile_query_excludes_reserved_fixture(self):
        source = PROFILE.read_text(encoding='utf-8')
        query = re.search(
            r'\.from\("wa_dshs_listed_facilities"\)(.*?)\.maybeSingle\(\)',
            source,
            re.DOTALL,
        )
        self.assertIsNotNone(query, 'Direct profile facility query missing')
        self.assertIn('.eq("license_number", license)', query.group(1))
        self.assertIn(f'.neq("id", "{FIXTURE_ID}")', query.group(1))

    def test_fixture_is_not_removed_from_development_database(self):
        source = PROFILE.read_text(encoding='utf-8')
        self.assertNotIn('.delete()', source)


if __name__ == '__main__':
    unittest.main()
