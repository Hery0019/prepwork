namespace Edge.Api.Domain.Common;

// CORE-014: the single shape of a paginated response. The property names produce
// `content`, `page`, `size` and `totalElements` once serialised.
public sealed record PagedResult<T>(IReadOnlyList<T> Content, int Page, int Size, long TotalElements)
{
    /// <summary>Maps the items while keeping the pagination.</summary>
    public PagedResult<TOther> Map<TOther>(Func<T, TOther> projection)
    {
        ArgumentNullException.ThrowIfNull(projection);
        return new PagedResult<TOther>([.. Content.Select(projection)], Page, Size, TotalElements);
    }
}
