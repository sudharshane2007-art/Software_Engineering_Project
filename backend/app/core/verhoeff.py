"""UIDAI Aadhaar Verhoeff Checksum Algorithm Implementation.

The Verhoeff algorithm is a checksum formula for error detection developed by
the Dutch mathematician Jacobus Verhoeff in 1969. UIDAI uses this algorithm for
all 12-digit Aadhaar numbers to ensure numerical validity and prevent false positives.
"""

# Multiplication table for Dihedral group D5
D_TABLE = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

# Permutation table
P_TABLE = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

# Inverse table
INV_TABLE = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def validate_verhoeff(number_str: str) -> bool:
    """Validate a numeric string using the Verhoeff algorithm.
    
    Args:
        number_str: String containing digits only (e.g. 12-digit Aadhaar).
        
    Returns:
        True if valid according to Verhoeff checksum, False otherwise.
    """
    clean_num = "".join(filter(str.isdigit, str(number_str)))
    if not clean_num:
        return False

    c = 0
    reversed_digits = [int(d) for d in reversed(clean_num)]
    
    for i, digit in enumerate(reversed_digits):
        p_val = P_TABLE[i % 8][digit]
        c = D_TABLE[c][p_val]

    return c == 0


def generate_verhoeff(number_str: str) -> str:
    """Generate the Verhoeff check digit for a string of digits."""
    clean_num = "".join(filter(str.isdigit, str(number_str)))
    if not clean_num:
        return ""

    c = 0
    reversed_digits = [int(d) for d in reversed(clean_num)]
    
    for i, digit in enumerate(reversed_digits):
        p_val = P_TABLE[(i + 1) % 8][digit]
        c = D_TABLE[c][p_val]

    return str(INV_TABLE[c])

